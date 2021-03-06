import os
import io
from dotenv import load_dotenv
load_dotenv(verbose=True)

import math
import cv2 as cv
import numpy as np
import pickle
import base64
import string
import secrets

from sklearn.decomposition import PCA
from sklearn.datasets import fetch_lfw_people
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
from sklearn import svm
from sklearn.model_selection import train_test_split
from sklearn.model_selection import GridSearchCV

from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin as firebase
from firebase_admin import auth
from firebase_admin import storage

STORAGE_BUCKET_NAME = os.getenv('STORAGE_BUCKET_NAME')
SCORE_THRESHOLD = float(os.getenv('SCORE_THRESHOLD'))

app = Flask(__name__)
CORS(app)

fb = firebase.initialize_app()
bucket = storage.bucket(STORAGE_BUCKET_NAME)


def cosine_similarity(v1,v2):
  v1_mag = math.sqrt(np.dot(v1,v1))
  v2_mag = math.sqrt(np.dot(v2,v2))
  return abs(np.dot(v1,v2)/(v1_mag*v2_mag))

def generate_password():
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(12))

def generate_token(uid):
  custom_token = auth.create_custom_token(uid).decode("utf-8") 
  return custom_token

def euclidean_distance(v1,v2):
  delta = v1-v2
  return math.sqrt(np.dot(delta,delta))

def score(v1,v2):
  return 1/euclidean_distance(v1,v2)
  

print(f'Using storage bucket {STORAGE_BUCKET_NAME}')
print(f'Face recognition score threshold {SCORE_THRESHOLD}')


## Get faces in the wild dataset

lfw_people = fetch_lfw_people(min_faces_per_person=1, resize=1)
n_samples, h, w = lfw_people.images.shape

aRatio = h/w
X = lfw_people.data
n_features = X.shape[1]
face_dimensions = lfw_people.images[0].shape

print(f'Imported {n_samples} faces.')

##

face_cascade = cv.CascadeClassifier('./haarcascade_frontalface_alt.xml');


def return_square_face(image):
  # Convert color image to grayscale for Viola-Jones
  grayscale_image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
  faces_bounding_boxes = face_cascade.detectMultiScale(grayscale_image)
  # iterate through bounding boxes
  for bb in faces_bounding_boxes:
      x, y, ww, hh = [ v for v in bb ]
      face = image[y:y+hh, x:x+ww]
      return face

# Return rectangular image containing face in dimensions of lfw images
def return_face(image):
  # Convert color image to grayscale for Viola-Jones
  grayscale_image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
  faces_bounding_boxes = face_cascade.detectMultiScale(grayscale_image)

  # iterate through bounding boxes
  for bb in faces_bounding_boxes:
      x, y, ww, hh = [ v for v in bb ]
      face = image[y:y+h, x:x+w]
      nw = (1/aRatio)*hh
      nh = aRatio*ww
      c = [x + (ww/2), y + (hh/2)]
      x_0 = c[0] - nw/2;
      x_1 = c[0] + nw/2
      rectFace = grayscale_image[y:y+hh,math.trunc(x_0):math.trunc(x_1)]
      face = cv.resize(rectFace, dsize=(face_dimensions[1], face_dimensions[0]), interpolation=cv.INTER_CUBIC)
      # low pass filtered face - i.e blurred
      lp_face = cv.GaussianBlur(face,(3,3),0)
      return lp_face
  
###

n_components = 128

print('Generating PCA loading vectors...')
pca = PCA(n_components=n_components, svd_solver='randomized',
          whiten=True).fit(X)

def get_eigenface(image):
  return pca.transform([image.flatten()])[0]

print(f'Generated {n_components} dimensional loading vectors.')
###

@app.route('/face/validate', methods=['POST'])
def validate_face():
    body = request.json
    snapshot = body['snapshot']
    try:
      binary = base64.b64decode(snapshot)
      image = np.asarray(bytearray(binary), dtype="uint8")
      image = cv.imdecode(image, cv.IMREAD_COLOR)
      face = return_face(image)
      if face is None:
        return { 'message': 'Face was not detected.', 'code': 400 }, 400
      else:
        return { 'message': 'Face was successfully detected.' }
    except Exception as e:
        return { 'message': str(e), 'code': 500 }, 500

@app.route('/signup', methods=['POST'])
def sign_up():
    body = request.json
    try:
      email = body['email']
      snapshot = body['snapshot']
      existing_user = auth.get_user_by_email(email)
    except:
      try:
        user = auth.create_user(email=email)
        uid = user.uid
        binary = base64.b64decode(snapshot)
        blob = bucket.blob(f'{uid}.jpg')
        blob.upload_from_string(io.BytesIO(binary).read(), content_type='image/jpeg')
        blob.make_public()
        return { 'user': uid, 'token': generate_token(uid) }
      except Exception as e:
        return { 'message': str(e), 'code': 500 }, 500
    else:
      return { 'message': 'User already exists', 'code': 406 }, 406


@app.route('/signin', methods=['POST'])
def signIn():
    body = request.json
    snapshot = body['snapshot']

    try:
      binary = base64.b64decode(snapshot)
      image = np.asarray(bytearray(binary), dtype="uint8")
      image = cv.imdecode(image, cv.IMREAD_COLOR)
      face = return_face(image)
      if face is None:
        raise Exception("No face detected")
      thumbnail = return_square_face(image)
      eigenface_original = get_eigenface(face)

      scores = []
      uids = []

      base64face = f"data:image/jpg;base64,{base64.b64encode(cv.imencode('.jpg', thumbnail)[1]).decode()}"

      max_score = 0

      for user in auth.list_users().iterate_all():
        blob = bucket.blob(f"{user.uid}.jpg")
        binary = blob.download_as_string()
        image = np.asarray(bytearray(binary), dtype="uint8")
        image = cv.imdecode(image, cv.IMREAD_COLOR) 
        eigenface_iteration = get_eigenface(return_face(image))
        score = cosine_similarity(eigenface_iteration,eigenface_original)

        uids.append(user.uid);
        scores.append(score)

        print(f'User {user.uid} | score: {score} | distance {1/score}')

      max_score = max(scores)
      max_score_index = scores.index(max_score)
      max_score_uid = uids[max_score_index]
      print(f'Max Score = {max_score} | Max Score User {max_score_uid}')
    except Exception as e:
        return { 'message': str(e), 'code': 500 }, 500

    if(max_score >= SCORE_THRESHOLD):
      return { 'uid': max_score_uid, 'token': generate_token(max_score_uid), 'score': max_score, 'face': base64face }
    else:
      return { 'message': 'Did not find match.', 'score': max_score, 'face': base64face, 'code': 401 }, 401

  