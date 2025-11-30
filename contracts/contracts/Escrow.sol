// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Escrow {
    struct Project {
        uint256 id;
        address client;
        address freelancer;
        string title;
        uint256 amount;
        uint256 duration;
        bool treatySigned;
        bool escrowDeposited;
        bool milestoneSubmitted;
        bool paymentReleased;
        bool disputed;
    }

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;

    event ProjectCreated(uint256 indexed id, address indexed client, string title, uint256 amount);
    event TreatySigned(uint256 indexed id, address indexed freelancer);
    event EscrowDeposited(uint256 indexed id, uint256 amount);
    event MilestoneSubmitted(uint256 indexed id);
    event PaymentReleased(uint256 indexed id, address indexed freelancer, uint256 amount);

    function createProject(string memory _title, uint256 _amount, uint256 _duration) external {
        projectCount++;
        projects[projectCount] = Project({
            id: projectCount,
            client: msg.sender,
            freelancer: address(0),
            title: _title,
            amount: _amount,
            duration: _duration,
            treatySigned: false,
            escrowDeposited: false,
            milestoneSubmitted: false,
            paymentReleased: false,
            disputed: false
        });
        emit ProjectCreated(projectCount, msg.sender, _title, _amount);
    }

    function signTreaty(uint256 _projectId, address _freelancer) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can initiate treaty");
        require(!project.treatySigned, "Treaty already signed");
        
        project.freelancer = _freelancer;
        project.treatySigned = true;
        emit TreatySigned(_projectId, _freelancer);
    }

    function depositEscrow(uint256 _projectId) external payable {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can deposit");
        require(project.treatySigned, "Treaty must be signed first");
        require(!project.escrowDeposited, "Escrow already deposited");
        require(msg.value == project.amount, "Incorrect deposit amount");

        project.escrowDeposited = true;
        emit EscrowDeposited(_projectId, msg.value);
    }

    function submitMilestone(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.freelancer, "Only freelancer can submit");
        require(project.escrowDeposited, "Escrow not deposited");
        require(!project.milestoneSubmitted, "Milestone already submitted");

        project.milestoneSubmitted = true;
        emit MilestoneSubmitted(_projectId);
    }

    function releasePayment(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can release");
        require(project.milestoneSubmitted, "Milestone not submitted");
        require(!project.paymentReleased, "Payment already released");

        project.paymentReleased = true;
        payable(project.freelancer).transfer(project.amount);
        emit PaymentReleased(_projectId, project.freelancer, project.amount);
    }
}
