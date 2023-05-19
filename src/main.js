import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
//Copy ABI in Remix and save it into the marketplace.abi.json. Then import it here
import marketplaceAbi from '../contract/marketplace.abi.json'

//Get ERC-20 ABI from Remix and paste it into the erc20.abi.json file in the project. Then import it here
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
// after deployment of your marketplace contract, copy and use address of the contract generated
// const MPContractAddress = "0xc414BeEAa263b609f26ABd8ABCc82F071b2aB224"
const MPContractAddress = "0x029050Dd2152Bf482DB4e2E228728917e3BE4580"
//address of the cUSD contract on the alfajores testnet 
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"


let kit
let contract
let products = []

//Once the user connects their Celo wallet, you will create an instance of the marketplace contract so you can interact with it.
const connectCeloWallet = async function () {
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to use it.")
      await window.celo.enable()
      notificationOff()
      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      //access the account of the user.
      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

//get the user's approval to make a transaction for a certain amount of token, (allowance)
async function approve(_price) {
  //create a cUSD contract instance with the ABI and the contract address, cUSDContract.
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)
  //call the cUSD contract method approve
  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

//access and display the user's cUSD balance.
const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  //convert it to be readable by shifting the comma 18 places to the left and use toFixed(2) to display only two decimal places after the decimal point.
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const getProducts = async function() {
  const _productsLength = await contract.methods.getProductsLength().call()
  const _products = []

  //declare an empty array for the product’s objects
  for (let i = 0; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readProduct(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        price: new BigNumber(p[5]),
        sold: p[6],
      })
    })
    _products.push(_product)
  }
  products = await Promise.all(_products)
  renderProducts()    // render the products 
}

function renderProducts() {
  document.getElementById("marketplace").innerHTML = ""
  products.forEach((_product) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = productTemplate(_product)
    document.getElementById("marketplace").appendChild(newDiv)
  })
}

function productTemplate(_product) {
  return `
  <style>
  .Bizcards .video{
    height: 70vh;
    width:25vw;
    border: 1px solid #CBA835;
    border-radius: 5px;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0, 5px, 15px, rgba(0,0,0,.7);
    position: relative;
    margin:10px;
}

.Bizcards .video .details{
    background-color: black;
    color: white;
    height: 35%;
    width: 100%;
}
.Bizcards .video  iframe{
    height: 65%;
    width: 100%;
    object-fit: cover;
    transition: .2s linear;
}
}
.Bizcards .popup-video{
    position: fixed;
    top: 0; left: 0;
    z-index: 100;
    background-color: rgba(0,0,0,.8);
    height: 100%;
    width: 100%;
    display: none;
}
.Bizcards .popup-video iframe{
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 750px;
    border-radius: 5px;
    border: 3px solid #fff;
    object-fit: cover;
}
.button{
  float:right;
}
.button a{
  margin-right: 30px;
  padding: 5px 15px;
  height: 100%;
  font-weight: 800;
  font-size: 15px;
  color: #CBA835;
  text-decoration: none;
  border: solid 2px #fff;
  padding: 5px 20px;
  border-radius: 20px;
  background-color: #000;
}
.button a:hover{
  background-color: #CBA835;
  color: #000;
}

.Bizcards .popup-video span{
    position: absolute;
    top: 5px; right: 20px;
    font-size: 50px;
    color: #CBA835;
    font-weight: bolder;
    z-index: 100;
    cursor: pointer;
}
@media (max-width:768px){
    .cards .popup-video .video{
        width: 95%;
    }
}
  </style>
    <div class="video">
      <iframe class=""
        src="${_product.image}">
      </iframe>
      <div class="" style="position:absolute; top:50%; left:0; background-color:black; font-size:23px; color:Yellow; padding:10px; border-radius:15px;">
        ${_product.sold} Trails
      </div>
      <div class="details">
        <div style="display:flex;">
          <div class="" style="width:30%; float:right;">
          ${identiconTemplate(_product.owner)}
          </div>
          <div style="width:70%; text-align:center; align-items:center;">
            <h4 class="" style="margin-bottom:5px;">${_product.name}</h4>
            <p class="" style="margin-bottom:5px;>
              ${_product.description}             
            </p>
            
          </div>
        </div>
        <p class="">
              <i class="" style="margin-bottom:5px;></i>
              <span>${_product.location}</span>
          </p>
        <div class="button">
          <a class="btn buyBtn" id=${
            _product.index
          }>
            Trail for ${_product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

//call your new functions once the page is loaded
window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getProducts()
  notificationOff()
});


//enable the user to create a new product and save it to your contract.
document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProductName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProductDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .writeProduct(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    //Then show a notification that you are in the process of adding a new product.
    notification(`🎉 You successfully added "${params[0]}".`)
    getProducts()
  })

  //enable the user to buy a product with button event listener
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id
    notification("⌛ Waiting for approval...")
    try {
      await approve(products[index].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting "${products[index].name}" trailing fee...`)
    try {
      const result = await contract.methods
        .buyProduct(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully trailed "${products[index].name}".`)
      getProducts()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})







