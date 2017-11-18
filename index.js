import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import Vision from '@google-cloud/vision';
import config from './config';


// sort text by y, x


// setup
const upload = multer({ dest: 'uploads/' });

const vision = Vision(config);

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
        res.sendStatus(401)
      }
    } catch (err) {
        console.log(err)
        res.sendStatus(400)
    }
})

app.get('/test', async (req, res) => {
  let data = require('./recipedata.json');
  let lineStrings = createLineStrings(data.slice(1))
  console.log(sorted)
  res.sendStatus(200, "some")
});

function sortByCoord (a, b) {

  let aLength = Math.pow(a.boundingPoly.vertices[0].x, 2) + Math.pow(a.boundingPoly.vertices[0].y, 2)
  let bLength = Math.pow(b.boundingPoly.vertices[0].x, 2) + Math.pow(b.boundingPoly.vertices[0].y, 2)

  if (aLength < bLength) {
    return -1
  } else {
    return 1
  }
}

function orderElementsByLine (data, lines) {
  const topLeftElement = data.sort(sortByCoord)[0]
  const lineHeight = topLeftElement.boundingPoly.vertices[3].y - topLeftElement.boundingPoly.vertices[0].y
  const sameLineElements = data.filter(el => el !== topLeftElement).filter(el => (el.boundingPoly.vertices[0].y - topLeftElement.boundingPoly.vertices[0].y) < lineHeight)
  const topLineElements = [topLeftElement, ...sameLineElements]

  lines = [...lines, topLineElements]
  const remainingElements = data.filter(function(x) {
    return topLineElements.indexOf(x) < 0;
  })

  if (remainingElements.length !== 0) {
    return orderElementsByLine(remainingElements, lines)
  }

  return lines
}

function createLineStrings(data) {
  const lines = orderElementsByLine(data, [])
  let lineString = ''
  return lines.map(line => line.map(element => element.description).join(' '))
}

// l, dl, cl, ml
// kg, g, mg

// text amount (char, comma, point) space unit
// amount & unit (\d*(\.|,)\d*)\s*(mg|g|kg|ml|cl|dl|l)

function amountToFloat( amount ) {
  return parseFloat( amount.replace(',', '.') )
}

function findInLine(lines) {
  const amountRegex = /(\d+[\.|,]*\d*)\s*(mg|g|kg|ml|cl|dl|l)/
  const ingredients = []
  // const lines = text.split("\n")

  // description: 'INGREDIENT\nWhite flour\nWater\nFine sea salt\nQUANTITY\n1,000 g\n780 g, 90°F to 95°F (32°C to 35°C)\n22 g\n0.8 g\nInstant dried yeast\n',

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

function extractIngredients(detections) {
  let ingredients = findInLine(detections);
  return ingredients
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
        // fs.writeFile('./recipedata.json', JSON.stringify(detections), null);
        // return extractIngredients(detections[0].description)
        const lines = createLineStrings(detections.slice(1))
        let some = extractIngredients(lines)
        console.log(some)
        return some
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
