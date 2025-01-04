

import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage })

//cb - callback
/* 
-> The multer module is used for handling multipart/form-data, primarily for uploading files in a Node.js application

=>destination :-

Specifies the folder where uploaded files should be stored.
It takes a callback function cb:
First argument: null (used for error handling, null means no error).
Second argument: Path to the folder (./public/temp in this case).
Here, all uploaded files will be stored in the ./public/temp directory.

=>filename:

Specifies the name of the file to be saved.
By default, multer generates a random filename, but you can customize it here.
file.originalname{here "file." you got multiple option check once} ensures that the uploaded file retains its original name.

Creating the upload Middleware

export const upload = multer({ storage: storage });

How It Works:

import express from "express";
import { upload } from "./path_to_upload_file";

const app = express();

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('File uploaded successfully');
});

{then you got upload.array('photos', 12) to store array , single for store one photo }

*/ 