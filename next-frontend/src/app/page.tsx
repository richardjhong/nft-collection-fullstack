"use client";

import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../../constants";

const Home = () => {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [presaleStarted, setPresaleStarted] = useState<boolean>(false);
  const [presaleEnded, setPresaleEnded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState<string>("0");
  const web3ModalRef = useRef<Web3Modal | undefined>(undefined);

  /**
   * presaleMint: Mint an NFT during the presale
   */
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);

      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * publicMint: Mint an NFT after the presale
   */
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);

      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * startPresale: Starts the presale for the NFT collection
   */
  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.startPresale();
      setLoading(true);

      await tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfPresaleStarted: Checks if the presale has started by quering the 'presaleStarted' variable in the contract
   */
  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.presaleStarted();

      if (!_presaleStarted) await getOwner();

      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkIfPresaleEnded: Checks if the presale has ended by quering the 'presaleEnded' variable in the contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();

      // _presaleEnded is BigNumber, using lt instead of '<'
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      hasEnded ? setPresaleEnded(true) : setPresaleEnded(false);
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner: Calls the contract to retrieve the owner
   */
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _owner = await nftContract.owner();

      const signer = (await getProviderOrSigner(true)) as providers.JsonRpcSigner;
      const address = await signer.getAddress();

      if (address.toLowerCase() === _owner.toLowerCase()) setIsOwner(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getTokenIdsMinted: Gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds is a 'Big Number', converting to string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    if (!web3ModalRef.current) {
      throw new Error("web3ModalRef.current is undefined");
    }

    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change the network to Sepolia");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    const connectAndCheckPresale = async () => {
      if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network: "sepolia",
          providerOptions: {},
          disableInjectedProvider: false,
        });
        connectWallet();

        // check if presale has started and ended
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          checkIfPresaleEnded();
        }

        getTokenIdsMinted();

        // Set an interval which gets called every 5 seconds to check presale has ended
        const presaleEndedInterval = setInterval(async function () {
          const _presaleStarted = await checkIfPresaleStarted();
          if (_presaleStarted) {
            const _presaleEnded = await checkIfPresaleEnded();
            if (_presaleEnded) {
              clearInterval(presaleEndedInterval);
            }
          }
        }, 5 * 1000);

        // Set an interval to get the number of token Ids minted every 5 seconds
        const tokenIdsMintedInterval = setInterval(async () => {
          await getTokenIdsMinted();
        }, 5 * 1000);

        // Clean up intervals when the component unmounts or walletConnected changes
        return () => {
          clearInterval(presaleEndedInterval);
          clearInterval(tokenIdsMintedInterval);
        };
      }
    };

    connectAndCheckPresale();
  }, [walletConnected]);

  /**
   * renderbutton: Returns a button based on the state of the dApp
   */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wallet
    if (!walletConnected) {
      return (
        <button
          onClick={connectWallet}
          className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center"
        >
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <button className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center">
          Loading...
        </button>
      );
    }

    // If connected user is the owner, and presale hasn't started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button
          onClick={startPresale}
          className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center"
        >
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className="text-lg">Presale hasn&#39;t started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className="text-lg">
            Presale has started!!! If your address is whitelisted, Mint a Crypto Dev 🥳
          </div>
          <button
            onClick={presaleMint}
            className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center"
          >
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, it's time for public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button
          onClick={publicMint}
          className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center"
        >
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta
          name="description"
          content="Whitelist-Dapp"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>
      <div className="min-h-screen flex flex-row justify-center items-center font-mono">
        <div className="mx-8">
          <h1 className="text-4xl mb-2">Welcome to Crypto Devs!</h1>
          <div className="text-lg">It&#39;s an NFT collection for developers in Crypto.</div>
          <div className="text-lg">{tokenIdsMinted}/20 have been minted</div>
          {renderButton()}
        </div>
        <div>
          <img
            className="w-70 h-50 ml-20"
            src="./crypto-devs.svg"
          />
        </div>
      </div>
      <footer className="flex justify-center items-center py-8 border-t-2 border-gray-300">
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
};

export default Home;
