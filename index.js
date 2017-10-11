import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import Vision from '@google-cloud/vision';


// setup
const upload = multer({ dest: 'uploads/' });

const vision = Vision({
  projectId: 'recipe-181917',
  keyFilename: './recipe-f4905ec6230c.json'
});

const testFile = fs.readFileSync(__dirname + '/sample.txt', 'utf8');

// app
const app = express();
app.use(cors());

app.listen(3000, function () {
    console.log('listening on port 3000!');
});

app.post('/recipe', upload.single('recipe'), async (req, res) => {
// app.post('/recipe', async (req, res) => {
    try {
      if (req.file) {
        const data = sendToApi(`./${req.file.path}`)
          .then( data => res.send(data) )
          .catch( () => res.sendStatus(401) )
      } else {
        res.sendStatus(401);
      }
    } catch (err) {
        console.log(err)
        res.sendStatus(400)
    }
})

// l, dl, cl, ml
// kg, g, mg

// text amount (char, comma, point) space unit
// amount & unit (\d*(\.|,)\d*)\s*(mg|g|kg|ml|cl|dl|l)

function amountToFloat( amount ) {
  return parseFloat( amount.replace(',', '.') );
}

function extractIngredients( text ) {
  const amountRegex = /(\d+[\.|,]*\d*)\s*(mg|g|kg|ml|cl|dl|l)/

  const ingredients = []

  const lines = text.split("\n")

  for (let line of lines) {
    let regexResult = amountRegex.exec(line);
    if (regexResult) {

      let amountAndUnit = regexResult[ 0 ];

      let ingredient = {
        unit: regexResult[ 2 ],
        amount: amountToFloat( regexResult[ 1 ] ),
        name: line.replace(amountAndUnit, '')
      }

      ingredients.push(ingredient);
    }
  }

  return ingredients;
}

function sendToApi (filename) {
  const request = {
    source: {
      filename: filename
    }
  };

  console.log(request);

  return vision.textDetection(request)
    .then((results) => {
      const detections = results[0].textAnnotations;
      console.log('Text:')
      console.log(detections[0])
      if (detections.length > 0) {
        return extractIngredients(detections[0].description)
      }

      // detections.forEach((text) => console.log(text));
    })
    .catch((err) => {
      console.error('ERROR:', err);
    });

}


// Instantiates a client

//
// let text = testFile.toString();
//
// let ingredients = extractIngredients( text )
// console.log( ingredients );

// The name of the image file to annotate
// const fileName = './diplom_5.jpeg';
// const fileName = './IMG_5347_2.jpg';
//
// Prepare the request object


// Performs text detection on the local file
// vision.textDetection({ source: { filename: fileName } })
