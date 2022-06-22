pragma solidity ^0.4.17;

contract Lottery{
    address public manager;
    address[] public players;

    constructor() public {
        manager = msg.sender;
    }

    function addNewPlayer() public payable{
        require(msg.value >= 1 ether);

        players.push(msg.sender);
    }

    function getPlayersArray() public view returns (address[]){
        return players;
    }

    function getBalance() public view returns (uint){
        return address(this).balance;
    }

    function selectWinner() public restricted{
        address contractAddress = this;
        uint index = generateWinnerIndex();
        players[index].transfer(contractAddress.balance);
        removeCurrentPlayers();
    }

    function generateWinnerIndex() private view returns(uint){
        return uint(keccak256(abi.encode(block.difficulty, now, players))) % players.length;
    }

    function removeCurrentPlayers() private{
        delete players;
    }

    modifier restricted(){
        require(msg.sender == manager);
        _;
    }

}