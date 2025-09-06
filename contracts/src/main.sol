// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract main {
    enum Category { Health, Financial, Education, Technology, Other }

    struct Campaign {
        string name; string description;
        address owner;
        Category category;
        string vector_db_cid;
        uint in_token_price; uint out_token_price;
        uint total_data_token;
        uint total_revenue;
        mapping (address => uint) contributes;
        address [] contributers;
    }

    mapping (address => uint) private virtualBalances;
    mapping (address => uint []) private contributedCampaigns; // campaignIDs
    Campaign [] private campaigns;

    uint private idCounter;
    address private admin;

    constructor (address rofl) {admin = rofl; idCounter = 0;}

    function vector_db_update (uint campaignId, string memory cid) public {
        require(msg.sender == admin, "Only admin can update vector DB");
        campaigns[campaignId].vector_db_cid = cid;
    }

    function contribute (uint campaignId, address contributer, uint data_token_amount) public {
        require(msg.sender == admin, "Only admin can contribute");
        campaigns[campaignId].total_data_token += data_token_amount;
        campaigns[campaignId].contributes[contributer] += data_token_amount;
        campaigns[campaignId].contributers.push(contributer);
        contributedCampaigns[contributer].push(campaignId);
    }

    function chat (uint in_token, uint out_token, address user, uint campaignId) public {
        uint cost = in_token * campaigns[campaignId].in_token_price + out_token * campaigns[campaignId].out_token_price;
        require(virtualBalances[user] >= cost, "Insufficient virtual balance");
        virtualBalances[user] -= cost;
        campaigns[campaignId].total_revenue += cost;
        for (uint i = 0; i < campaigns[campaignId].contributers.length; i++) {
            address contributor = campaigns[campaignId].contributers[i];
            uint share = cost * (campaigns[campaignId].contributes[contributor] / campaigns[campaignId].total_data_token);
            virtualBalances[contributor] += share;
        }
    }

    function createCampaign (string memory name, string memory description, string memory vector_db_cid, address owner, Category category, uint in_token_price, uint out_token_price, uint initial_data_token) public {
        Campaign storage c = campaigns[idCounter];
        c.name = name;
        c.description = description;
        c.owner = owner;
        c.category = category;
        c.vector_db_cid = vector_db_cid;
        c.in_token_price = in_token_price;
        c.out_token_price = out_token_price;
        c.total_data_token = initial_data_token;
        c.total_revenue = 0;
        c.contributers.push(owner);
        c.contributes[owner] += initial_data_token;
        idCounter++;
    }

    function getCampaign (uint campaignId) public view returns (string memory, string memory, address, Category, string memory, uint, uint, uint, uint) {
        Campaign storage c = campaigns[campaignId];
        return (c.name, c.description, c.owner, c.category, c.vector_db_cid, c.in_token_price, c.out_token_price, c.total_data_token, c.total_revenue);
    }

    function getUser (address user) public view returns (uint, uint [] memory, uint [] memory) {
        uint balance = virtualBalances[user];
        uint [] memory contributeAmount = new uint [](contributedCampaigns[user].length);
        uint [] memory takenShare = new uint [](contributedCampaigns[user].length);
        for (uint i = 0; i < contributedCampaigns[user].length; i++) {
            uint campaignId = contributedCampaigns[user][i];
            contributeAmount[i] = campaigns[campaignId].contributes[user];
            takenShare[i] = campaigns[campaignId].total_revenue * (contributeAmount[i] / campaigns[campaignId].total_data_token); 
        }

        return (balance, contributeAmount, takenShare);
    }

    function stake () public payable {
        virtualBalances[msg.sender] += msg.value;
    }

    function withdraw (uint amount) public {
        require(virtualBalances[msg.sender] >= amount, "Insufficient virtual balance");
        virtualBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}    