import React , { useState} from 'react';
import './App.css'
import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import idl from './solana_storage_dapp.json';

//systemprogram
const { SystemProgram, Keypair } = anchor.web3;

//create a keypair for the account
let myAccount = Keypair.generate();

//getthe program id from the idl
const programID = new PublicKey(idl.metadata.address);
console.log(programID,'programid set correctly from idl');

//set our network to devnet
const network = clusterApiUrl('devnet');

//control how we want to acknowledge transactions
const opts = {
  preflightCommitment: "processed"
};


function App() {

  const [walletAddress, setWalletAddress] = useState(null);
  const [retrieveValue , setRetrieveValue] = useState(null);
  const [inputValue, setInputValue] = useState('');

  window.onload = async () => {
    try {
      if(window.solana){

        const solana= window.solana;
        if(solana.isPhantom){
          console.log("phantom wallet found!")
          const res= await solana.connect({onlyIfTrusted: true});
          console.log('connected with public key: ', res.publicKey.toString())
          setWalletAddress(res.publicKey.toString())
          await Retrieve();
          if( retrieveValue === null){
            await CreateAccount();
          }
        }

      }else{
        alert("wallet not found! get a phantom wallet :)")
      }
    } catch (error) {
      console.error(error);
    }
  }

  const connectwallet = async () => {
    if(window.solana){
      const solana= window.solana;
      const res= await solana.connect();
      setWalletAddress(res.publicKey.toString())
    }else{
      alert("wallet not found! get a phantom wallet :)")
    }
  }

  const getprovider =  () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new anchor.AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment,
    )
    console.log(provider,'provider set correctly')
    return provider;  
  }

  const Retrieve = async () => {
    try{
      const provider =  getprovider();
      const program = new anchor.Program(idl, programID, provider);
      const account = await program.account.init.fetch(myAccount.publicKey);
      setRetrieveValue(account.value.toString());
      console.log('retireved value: ', retrieveValue);
    } catch(err) {
      console.log('Error in fetching',err);
      setRetrieveValue(null);
    }
  }

  const CreateAccount = async () => {
    try{
      const provider = getprovider();
      const program = new anchor.Program(idl, programID, provider);
      let tx = await program.rpc.initialize({
        accounts : {
          initialAccount : myAccount.publicKey,
          user : provider.wallet.publicKey,
          systemProgram : SystemProgram.programId
        },
        signers : [myAccount],
    
      })
      
      console.log('created a new myaccount w/ address: ', myAccount.publicKey.toString());

    } catch (err) {
      console.log('Error in creating account',err);
    }
  }
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const UpdateValue = async () => {
    try{
      const provider = getprovider();
      const program = new anchor.Program(idl, programID, provider);
      const value = new anchor.BN(inputValue);
      let tx2 = await program.rpc.updateValue(value, {
        accounts : {
          storageAccount : myAccount.publicKey,
        },
        // signers : [myAccount],
      })

    } catch (err) {
      console.log('Error in updating value',err);
    }
  }
  return (
    <div className="App">
      <div className="">
        <h2 className='header'>Solana Storage Dapp</h2>
        <div >
        {!walletAddress && (
          <div>
            <button className='btn' onClick={connectwallet}>Connect Wallet
            </button> 
          </div>
        )}
        {walletAddress && (
          <div>
            <p>
              Wallet Address: {' '}
              <span className='address'>{walletAddress}</span>
            </p>
            <div className='grid-container'>
              {/*set value column one */ }
              <div className='grid-item'>
                <input
                  value={inputValue}
                  placeholder='Enter a number'
                  onChange={onInputChange}
                  ></input>
                  <button className='btn2' onClick={UpdateValue}>Store</button>

              </div>
              {/*retrieve value column two */}
              <div className='grid-item'>
              <button className='btn2' onClick={Retrieve}>Retrieve</button>
              <p>{retrieveValue}</p>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

export default App;
