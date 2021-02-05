# FaceID 

![Demo image](demo.gif)

Trivial implementation of a facial recognition authentication system using dimensionality reduction technique PCA ("Eigenfaces") and computing face similarities using Euclidean Distance. 

Note: This approach is very sensitive to lighting conditions, and should not be used for production authentication systems due to many vunerabilities associated with authenticating using a still 2D image and limitations of this approach.

## Frontend (React)

Navigate to `webapp` folder and follow instructions below.

### Set up

#### Install dependencies
```sh
yarn
```

#### Configuration

Create `.env` file and modify values as required
```sh
cp .env.example .env
```

### Run Dev Server

```sh
yarn start
```

### Build Production Assets

```sh
yarn build
```

## Backend (Python)

Navigate to `model` folder and follow instructions below.

### Set up

#### Install dependencies
```sh
python3 -m venv env
source ./env/bin/activate

pip install -r requirements.txt
```

#### Configuration

Create `.env` file and modify values as required
```sh
cp .env.example .env
```

### Run Server

```sh
FLASK_APP=api.py flask run
```