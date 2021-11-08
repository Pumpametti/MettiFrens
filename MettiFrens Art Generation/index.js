var path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const {
  layers,
  width,
  height,
  description,
  baseImageUri,
  editionSize,
  startEditionFrom,
  rarityWeights,
} = require("./input/config.js");
const console = require("console");
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
var attributesList = [];
var metadataList = [];
var dnaList = [];

// saves the generated image to the output folder, using the edition count as the name
const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `./output/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const generateMetadata = (_dna, _edition, _attributesList) => {
  // let dateTime = Date.now();
  let tempMetadata = {
    // date: dateTime,
    attributes: _attributesList,
    image: `${baseImageUri}/${_edition.png}`,
    name: `Metti Landscape #${_edition}`,
    description: description,
    edition: _edition,
    dna: _dna.join(""),
  };
  metadataList.push(tempMetadata);
  return tempMetadata;
};

// prepare attributes for the given element to be used as metadata

const getAttributeForElement = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  var parentDir = path.dirname(_element.layer.selectedElement.path);
  var baseDir = require("path").resolve(parentDir, "..");
  var traitName = path.basename(baseDir);
  let attribute = {
    trait_type: traitName,
    value: selectedElement.name,
    rarity: selectedElement.rarity,
  };
  return attribute;
};

// loads an image from the layer path
// returns the image in a format usable by canvas
const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_element) => {
  ctx.drawImage(
    _element.loadedImage,
    _element.layer.position.x,
    _element.layer.position.y,
    _element.layer.size.width,
    _element.layer.size.height
  );
};

// check the configured layer to find information required for rendering the layer
// this maps the layer information to the generated dna and prepares it for
// drawing on a canvas
const constructLayerToDna = (_dna = [], _layers = [], _rarity) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (element) => element.id === _dna[index]
    );
    return {
      location: layer.location,
      position: layer.position,
      size: layer.size,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

// check if the given dna is contained within the given dnaList
// return true if it is, indicating that this dna is already in use and should be recalculated
const isDnaUnique = (_DnaList = [], _dna = []) => {
  let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
  return foundDna == undefined ? true : false;
};

const getRandomRarity = (_rarityOptions) => {
  let randomPercent = Math.random() * 100;
  let percentCount = 0;

  for (let i = 0; i <= _rarityOptions.length; i++) {
    percentCount += _rarityOptions[i].percent;
    if (percentCount >= randomPercent) {
      console.log(`use random rarity ${_rarityOptions[i].id}`);
      return _rarityOptions[i].id;
    }
  }
  return _rarityOptions[0].id;
};

// create a dna based on the available layers for the given rarity
// use a random part for each layer
const createDna = (_layers, _rarity) => {
  let randNum = [];
  let _rarityWeight = rarityWeights.find((rw) => rw.value === _rarity);
  _layers.forEach((layer) => {
    let num = Math.floor(
      Math.random() * layer.elementIdsForRarity[_rarity].length
    );
    if (_rarityWeight && _rarityWeight.layerPercent[layer.id]) {
      // if there is a layerPercent defined, we want to identify which dna to actually use here (instead of only picking from the same rarity)
      let _rarityForLayer = getRandomRarity(
        _rarityWeight.layerPercent[layer.id]
      );
      num = Math.floor(
        Math.random() * layer.elementIdsForRarity[_rarityForLayer].length
      );
      randNum.push(layer.elementIdsForRarity[_rarityForLayer][num]);
    } else {
      randNum.push(layer.elementIdsForRarity[_rarity][num]);
    }
  });
  return randNum;
};

// holds which rarity should be used for which image in edition
let rarityForEdition;
// get the rarity for the image by edition number that should be generated
const getRarity = (_editionCount) => {
  if (!rarityForEdition) {
    // prepare array to iterate over
    rarityForEdition = [];
    rarityWeights.forEach((rarityWeight) => {
      for (let i = rarityWeight.from; i <= rarityWeight.to; i++) {
        rarityForEdition.push(rarityWeight.value);
      }
    });
  }
  return rarityForEdition[editionSize - _editionCount];
};

const writeMetaData = (_data) => {
  fs.writeFileSync("./output/_metadata.json", _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  fs.writeFileSync(
    `./output/${_editionCount}.json`,
    JSON.stringify(metadataList.find((meta) => meta.edition == _editionCount))
  );
};

// holds which dna has already been used during generation
let dnaListByRarity = {};
// holds metadata for all NFTs
// Create generative art by using the canvas api
const startCreating = async () => {
  console.log("##################");
  console.log("# Generative Art");
  console.log("# - Create your NFT collection");
  console.log("##################");

  console.log();
  console.log("start creating NFTs.");

  // clear meta data from previous run
  writeMetaData("");

  // prepare dnaList object
  rarityWeights.forEach((rarityWeight) => {
    dnaListByRarity[rarityWeight.value] = [];
  });

  // create NFTs from startEditionFrom to editionSize
  let editionCount = startEditionFrom;
  while (editionCount <= editionSize) {
    console.log("-----------------");
    console.log("creating NFT %d of %d", editionCount, editionSize);

    // get rarity from to config to create NFT as
    let rarity = getRarity(editionCount);
    console.log("- rarity: " + rarity);

    // calculate the NFT dna by getting a random part for each layer/feature
    // based on the ones available for the given rarity to use during generation
    let newDna = createDna(layers, rarity);
    while (!isDnaUnique(dnaListByRarity[rarity], newDna)) {
      // recalculate dna as this has been used before.
      console.log(
        "found duplicate DNA " + newDna.join("-") + ", recalculate..."
      );
      newDna = createDna(layers, rarity);
    }
    console.log("- dna: " + newDna.join("-"));

    // propagate information about required layer contained within config into a mapping object
    // = prepare for drawing
    let results = constructLayerToDna(newDna, layers, rarity);
    let loadedElements = [];

    // load all images to be used by canvas
    results.forEach((layer) => {
      loadedElements.push(loadLayerImg(layer));
    });

    // elements are loaded asynchronously
    // -> await for all to be available before drawing the image

    await Promise.all(loadedElements).then((elementArray) => {
      ctx.clearRect(0, 0, width, height);
      let attributesList = [];
      elementArray.forEach((element) => {
        drawElement(element);
        attributesList.push(getAttributeForElement(element));
      });
      saveImage(editionCount);
      generateMetadata(newDna, editionCount, attributesList);
      saveMetaDataSingleFile(editionCount);
      console.log("- edition " + editionCount + " created.");
      console.log();
    });
    dnaListByRarity[rarity].push(newDna);
    dnaList.push(newDna);
    editionCount++;
  }
  writeMetaData(JSON.stringify(metadataList));
};

// Initiate code
startCreating();
