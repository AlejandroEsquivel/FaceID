# FaceID - API

## Set up

### Install dependencies
```sh
python3 -m venv env
source ./env/bin/activate

pip install -r requirements.txt
```

### Configuration

Create `.env` file and modify values are required
```sh
cp .env.example .env
```

## Run Server

```sh
FLASK_APP=api.py flask run
```