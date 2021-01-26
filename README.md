# FaceID 

Trivial implementation of a facial recognition authentication system using dimensionality reduction technique PCA / Eigenfaces approach.

## Frontend (React)

### Set up

#### Install dependencies
```sh
yarn
```

#### Configuration

Create `.env` file and modify values are required
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

### Set up

#### Install dependencies
```sh
python3 -m venv env
source ./env/bin/activate

pip install -r requirements.txt
```

#### Configuration

Create `.env` file and modify values are required
```sh
cp .env.example .env
```

### Run Server

```sh
FLASK_APP=api.py flask run
```