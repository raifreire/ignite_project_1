const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];


function verifyIfExistsAccount(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "not found" });
    }

    req.customer = customer;

    return next();
}


function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
};


app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerexists = customers.some((customer) => customer.cpf === cpf);

    if (customerexists) {
        return res.status(400).json({ error: "data alreadey exists in database" })
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return res.status(201).send("insert data")
});


app.get("/statement", verifyIfExistsAccount, (req, res) => {
    const { customer } = req;
    return res.json(customer.statement);
});


app.post("/deposit", verifyIfExistsAccount, (req, res) => {
    const { description, amount } = req.body;

    const { customer } = req;

    const customerOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(customerOperation);

    return res.status(201).send();
});


app.post("/withdraw", verifyIfExistsAccount, (req, res) => {
    const { amount } = req.body;

    const { customer } = req;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({ error: "insufficient credits" });
    }

    const customerOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(customerOperation);

    return res.status(201).send();
});


app.get("/statement/date", verifyIfExistsAccount, (req, res) => {
    const { date } = req.query;

    const { customer } = req;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return res.json(statement);
});


app.put("/account", verifyIfExistsAccount, (req, res) => {
    const { name } = req.body;

    const { customer } = req;

    customer.name = name;

    return res.status(201).send("name alterado para: " + customer.name);
});


app.get("/account", verifyIfExistsAccount, (req, res) => {
    const { customer } = req;

    return res.json(customer);
});


app.delete("/remove", verifyIfExistsAccount, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(200).json(customers);
});


app.get("/balance", verifyIfExistsAccount, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.json(balance);
});


app.listen(3333);
