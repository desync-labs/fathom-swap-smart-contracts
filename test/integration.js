const hre = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe("Integration", function() {
    this.timeout(20000);

    let admin, alice, bob, charlie;
    let coder;

    let fathomswapFactory;
    let WETH;
    let router;
    let WXDC;
    let USDT;
    let ABC;

    async function deploy(contractName, signer, ...args) {
        const Factory = await ethers.getContractFactory(contractName, signer)
        const instance = await Factory.deploy(...args)
        return instance.deployed()
    }

    async function deployWithLib(contractName, signer, libs, ...args) {
        const Factory = await ethers.getContractFactory(contractName, {libraries: libs,}, signer);
        const instance = await Factory.deploy(...args)
        return instance.deployed()
    }

    function getIndexedEventArgsRAW(tx, eventSignature, eventNotIndexedParams) {
        const sig = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
        const log = getLogByFirstTopic(tx, sig);
        return coder.decode(
            eventNotIndexedParams,
            log.data
        );
    }

    function getIndexedEventArgs(tx, eventSignature, topic) {
        const sig = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
        const log = getLogByFirstTopic(tx, sig);
        return log.args[topic];
    }

    function getLogByFirstTopic(tx, firstTopic) {
        const logs = tx.events;

        for(let i = 0; i < logs.length; i++) {
            if(logs[i].topics[0] === firstTopic){
                return logs[i];
            }
        }
        return null;
    }

    async function addLiquidity(token1Address, token2Address, token1Symbol, token2Symbol, token1Amount, token2Amount, tokenOwner, router, factory) {
        console.log(`Adding Liquidity for Pair ${token1Symbol}-${token2Symbol}`)
        
        await router.addLiquidity(
            token1Address, 
            token2Address, 
            parseEther(token1Amount.toString()), 
            parseEther(token2Amount.toString()),  
            parseEther(token1Amount.toString()),  
            parseEther(token2Amount.toString()),  
            tokenOwner.address, 
            await getDeadlineTimestamp(10000)
        );
    
        let pairAddress  = await factory.getPair(token1Address, token2Address) 
        const BEP20 = await hre.ethers.getContractFactory("BEP20");
        const pairAsToken = BEP20.attach(pairAddress)
    
        console.log(`${token1Symbol}-${token2Symbol} Pair Added to Liquidity Pool at Address ${pairAddress}`)
        console.log(`Balance of LP token for pair ${token1Symbol}-${token2Symbol} is ${await pairAsToken.balanceOf(tokenOwner.address)}`)
    }

    async function printPrice(pair) {
        const reserves = await pair.getReserves();
        const price = reserves[0]/ (reserves[1]);
        console.log(`price : ${price}`);
    }

    async function swapTokensDiv10(tokenIn, tokenOut, amountIn, wallet, router) {
        var amounts = await router.getAmountsOut(parseEther(amountIn.toString()), [tokenIn, tokenOut])
        const amountOutMin = amounts[1].sub(amounts[1].div(10));
    
        await router.connect(wallet).swapExactTokensForTokens(
            parseEther(amountIn.toString()),
            amountOutMin,
            [tokenIn, tokenOut],
            wallet.address,
            Date.now() + 1000 * 60 * 3 //10 minutes
        );
    }

    async function swapTokensDiv5(tokenIn, tokenOut, amountIn, wallet, router) {
        var amounts = await router.getAmountsOut(parseEther(amountIn.toString()), [tokenIn, tokenOut])
        const amountOutMin = amounts[1].sub(amounts[1].div(5));
    
        await router.connect(wallet).swapExactTokensForTokens(
            parseEther(amountIn.toString()),
            amountOutMin,
            [tokenIn, tokenOut],
            wallet.address,
            Date.now() + 1000 * 60 * 3 //10 minutes
        );
    }

    async function swapTokensWithPath(path, amountIn, wallet, router) {
        var amounts = await router.getAmountsOut(parseEther(amountIn.toString()), path)
        const amountOutMin = amounts[2].sub(amounts[2].div(10));
    
        await router.connect(wallet).swapExactTokensForTokens(
            parseEther(amountIn.toString()),
            amountOutMin,
            path,
            wallet.address,
            Date.now() + 1000 * 60 * 3 //10 minutes
        );
    }
    
    async function getDeadlineTimestamp(deadline) {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        return blockBefore.timestamp + deadline;
    }

    it("Wallets and coder setup", async function() {
        coder = ethers.utils.defaultAbiCoder;
        [admin, alice, bob, charlie] = await ethers.getSigners();
    });
    
    it("Deploy system", async function() {
        fathomswapFactory = await deploy("UniswapV2Factory", admin, admin.address);
        console.log("FathomswapFactory was deployed on address " + fathomswapFactory.address);

        console.log("creation code : ", await fathomswapFactory.getInitHash());

        WETH = await deploy("WETH9", admin);
        console.log("WETH token was deployed on address " + WETH.address);

        router = await deploy("UniswapV2Router02", admin, fathomswapFactory.address, WETH.address);
        console.log("FathomswapRouter was deployed on address " + router.address);

        WXDC = await deploy("BEP20", admin, "WXDC", "WXDC");
        console.log("WXDC token was deployed on address " + WXDC.address);

        USDT = await deploy("BEP20", admin, "USDT", "USDT");
        console.log("USDT token was deployed on address " + USDT.address);

        ABC = await deploy("BEP20", admin, "ABC", "ABC");
        console.log("ABC token was deployed on address " + ABC.address);

        await WXDC.mint(admin.address, parseEther("1000000"));
        await USDT.mint(admin.address, parseEther("1000000"));
        await ABC.mint(admin.address, parseEther("1000000"));
    });
    
    it("Add liquidity", async function() {
        await WXDC.approve(router.address, parseEther("10000"));
        await USDT.approve(router.address, parseEther("70000"));
        await ABC.approve(router.address, parseEther("10000"));

        await addLiquidity(
            WXDC.address,
            USDT.address,
            "WXDC",
            "USDT",
            10000,
            20000,
            admin,
            router,
            fathomswapFactory
        );
        await addLiquidity(
            ABC.address,
            USDT.address,
            "ABC",
            "USDT",
            10000,
            40000,
            admin,
            router,
            fathomswapFactory
        );
    });

    it("Simple swap", async function() {
        await WXDC.mint(alice.address, parseEther("10000"))
        await WXDC.connect(alice).approve(router.address, parseEther("10000"));

        console.log("Alice USDT balance " + await USDT.balanceOf(alice.address));
        console.log("Alice WXDC balance " + await WXDC.balanceOf(alice.address));

        await swapTokensDiv10(WXDC.address, USDT.address, 10000, alice, router);

        console.log("Alice USDT balance " + await USDT.balanceOf(alice.address));
        console.log("Alice WXDC balance " + await WXDC.balanceOf(alice.address));
    });

    it("Cross pool swap", async function() {
        await WXDC.mint(bob.address, parseEther("100"))
        await WXDC.connect(bob).approve(router.address, parseEther("100"));

        console.log("Bob WXDC balance " + await WXDC.balanceOf(bob.address));
        console.log("Bob ABC balance " + await ABC.balanceOf(bob.address));

        await swapTokensWithPath([WXDC.address, USDT.address, ABC.address], 100, bob, router);

        console.log("Bob WXDC balance " + await WXDC.balanceOf(bob.address));
        console.log("Bob ABC balance " + await ABC.balanceOf(bob.address));
    });

    it("Price manipulation", async function() {
        const pairAddress = await fathomswapFactory.getPair(WXDC.address, USDT.address);
        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(pairAddress);

        await printPrice(pair);

        //Mint some WXDC to Alice
        await WXDC.mint(alice.address, parseEther("4000"))
        await WXDC.connect(alice).approve(router.address, parseEther("4000"));

        await swapTokensDiv5(WXDC.address, USDT.address, 4000, alice, router);
        console.log("Significant amount of WXDC was swaped");

        await printPrice(pair);
    });
});

