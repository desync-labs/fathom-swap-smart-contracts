pragma solidity =0.6.6;

import "./core/interfaces/IFathomswapFactory.sol";
import './interfaces/IERC20.sol';
import './interfaces/IWETH.sol';
import './interfaces/IFathomswapRouter02.sol';
import './libraries/TransferHelper.sol';
import './libraries/FathomswapLibrary.sol';
import './libraries/SafeMath.sol';

contract FathomswapRouter02 is IFathomswapRouter02 {
    using SafeMath for uint;
    event Test(address indexed caller);
    address public immutable override factory;
    address public immutable override WETH;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'FathomswapRouter: EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH) public {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (IFathomswapFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IFathomswapFactory(factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = FathomswapLibrary.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = FathomswapLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'FathomswapRouter: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = FathomswapLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'FathomswapRouter: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function getAmountOutTest(uint amountIn, address[] calldata path) external view returns (uint) {
        uint[] memory amounts = FathomswapLibrary.getAmountsOut(factory, amountIn, path);
        return amounts[amounts.length - 1];
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = FathomswapLibrary.pairFor(factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IFathomswapPair(pair).mint(to);
    }
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            WETH,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = FathomswapLibrary.pairFor(factory, token, WETH);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = IFathomswapPair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = FathomswapLibrary.pairFor(factory, tokenA, tokenB);
        IFathomswapPair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = IFathomswapPair(pair).burn(to);
        (address token0,) = FathomswapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'FathomswapRouter: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'FathomswapRouter: INSUFFICIENT_B_AMOUNT');
    }
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = FathomswapLibrary.pairFor(factory, tokenA, tokenB);
        uint value = approveMax ? uint(-1) : liquidity;
        IFathomswapPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountToken, uint amountETH) {
        address pair = FathomswapLibrary.pairFor(factory, token, WETH);
        uint value = approveMax ? uint(-1) : liquidity;
        IFathomswapPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountETH) = removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, to, deadline);
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountETH) {
        (, amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountETH) {
        address pair = FathomswapLibrary.pairFor(factory, token, WETH);
        uint value = approveMax ? uint(-1) : liquidity;
        IFathomswapPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            token, liquidity, amountTokenMin, amountETHMin, to, deadline
        );
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = FathomswapLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? FathomswapLibrary.pairFor(factory, output, path[i + 2]) : _to;
            IFathomswapPair(FathomswapLibrary.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = FathomswapLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'FathomswapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, FathomswapLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = FathomswapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'FathomswapRouter: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, FathomswapLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WETH, 'FathomswapRouter: INVALID_PATH');
        amounts = FathomswapLibrary.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'FathomswapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(FathomswapLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'FathomswapRouter: INVALID_PATH');
        amounts = FathomswapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'FathomswapRouter: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, FathomswapLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'FathomswapRouter: INVALID_PATH');
        amounts = FathomswapLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'FathomswapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, FathomswapLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WETH, 'FathomswapRouter: INVALID_PATH');
        amounts = FathomswapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, 'FathomswapRouter: EXCESSIVE_INPUT_AMOUNT');
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(FathomswapLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
    }

    // // **** SWAP (supporting fee-on-transfer tokens) ****
    // // requires the initial amount to have already been sent to the first pair
    // function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
    //     for (uint i; i < path.length - 1; i++) {
    //         (address input, address output) = (path[i], path[i + 1]);
    //         (address token0,) = FathomswapLibrary.sortTokens(input, output);
    //         IFathomswapPair pair = IFathomswapPair(FathomswapLibrary.pairFor(factory, input, output));
    //         uint amountInput;
    //         uint amountOutput;
    //         { // scope to avoid stack too deep errors
    //         (uint reserve0, uint reserve1,) = pair.getReserves();
    //         (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    //         amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
    //         amountOutput = FathomswapLibrary.getAmountOut(amountInput, reserveInput, reserveOutput);
    //         }
    //         (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
    //         address to = i < path.length - 2 ? FathomswapLibrary.pairFor(factory, output, path[i + 2]) : _to;
    //         pair.swap(amount0Out, amount1Out, to, new bytes(0));
    //     }
    // }
    // function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    //     uint amountIn,
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // ) external virtual override ensure(deadline) {
    //     TransferHelper.safeTransferFrom(
    //         path[0], msg.sender, FathomswapLibrary.pairFor(factory, path[0], path[1]), amountIn
    //     );
    //     uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    //     _swapSupportingFeeOnTransferTokens(path, to);
    //     require(
    //         IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
    //         'FathomswapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    //     );
    // }
    // function swapExactETHForTokensSupportingFeeOnTransferTokens(
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // )
    //     external
    //     virtual
    //     override
    //     payable
    //     ensure(deadline)
    // {
    //     require(path[0] == WETH, 'FathomswapRouter: INVALID_PATH');
    //     uint amountIn = msg.value;
    //     IWETH(WETH).deposit{value: amountIn}();
    //     assert(IWETH(WETH).transfer(FathomswapLibrary.pairFor(factory, path[0], path[1]), amountIn));
    //     uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    //     _swapSupportingFeeOnTransferTokens(path, to);
    //     require(
    //         IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
    //         'FathomswapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    //     );
    // }
    // function swapExactTokensForETHSupportingFeeOnTransferTokens(
    //     uint amountIn,
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // )
    //     external
    //     virtual
    //     override
    //     ensure(deadline)
    // {
    //     require(path[path.length - 1] == WETH, 'FathomswapRouter: INVALID_PATH');
    //     TransferHelper.safeTransferFrom(
    //         path[0], msg.sender, FathomswapLibrary.pairFor(factory, path[0], path[1]), amountIn
    //     );
    //     _swapSupportingFeeOnTransferTokens(path, address(this));
    //     uint amountOut = IERC20(WETH).balanceOf(address(this));
    //     require(amountOut >= amountOutMin, 'FathomswapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
    //     IWETH(WETH).withdraw(amountOut);
    //     TransferHelper.safeTransferETH(to, amountOut);
    // }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return FathomswapLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return FathomswapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountIn)
    {
        return FathomswapLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return FathomswapLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return FathomswapLibrary.getAmountsIn(factory, amountOut, path);
    }
}
