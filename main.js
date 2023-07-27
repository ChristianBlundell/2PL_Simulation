const fs = require('fs');

class TwoPhaseLocking {
    constructor() {
        this.transTable = new Map();
        this.lockTable = new Map();
        this.timeStamp = 0;
        this.committ = [];
        this.aborts = [];
    }

    logToFile(path, data){
        fs.appendFile(path, data + '\n', (err) => {
            if (err) throw err;
        });
    }

    startOperation(op) {
        if (op.startsWith("b")) {
            this.beginOperation(op);
        } else if (op.startsWith("r")) {
            this.readOperation(op);
        } else if (op.startsWith("w")) {
            this.writeOperation(op);
        } else if (op.startsWith("e")) {
            this.endOperation(op, 0);
        }
    }

    beginOperation(op) {
        const transaction = {
            TID: parseInt(op[1]),
            TS: ++this.timeStamp,
            state: "active",
            items: [],
            wait: []
        };

        this.transTable.set(transaction.TID, transaction);
        console.log(`${op} T${transaction.TID} begins. Id=${transaction.TID}. TS=${transaction.TS}. state=${transaction.state}.`);
        this.logToFile('output.txt', `${op} T${transaction.TID} begins. Id=${transaction.TID}. TS=${transaction.TS}. state=${transaction.state}.`);
    }

    readOperation(op) {
        const TID = parseInt(op[1]);
        const transaction = this.transTable.get(TID);

        if (transaction.state === "abort") {
            console.log(`${op} T${TID} is already aborted.`);
            this.logToFile('output.txt', `${op} T${TID} is already aborted.`);
        } else if (transaction.state === "blocked") {
            transaction.wait.push(op);
        } else if (transaction.state === "active") {
            const match = /\((.*?)\)/.exec(op);
            const variable = match[1];

            if (!this.lockTable.has(variable)) {
                const lock = {
                    itemName: variable,
                    lockState: "RL",
                    lockTID: [TID],
                    waitingTransactions: []
                };

                this.lockTable.set(variable, lock);
                console.log(`${op} ${variable} is read locked by T${transaction.TID}.`);
                this.logToFile('output.txt', `${op} ${variable} is read locked by T${transaction.TID}.`);
                transaction.items.push(variable);
                this.transTable.set(transaction.TID, transaction);
            } else if (this.lockTable.has(variable)) {
                const lock = this.lockTable.get(variable);

                if (lock.lockState === "RL") {
                    transaction.items.push(variable);
                    this.transTable.set(transaction.TID, transaction);
                    lock.lockTID.push(TID);
                    this.lockTable.set(variable, lock);
                    console.log(`${op} ${variable} is read locked by T${transaction.TID}.`);
                    this.logToFile('output.txt', `${op} ${variable} is read locked by T${transaction.TID}.`);
                } else if (lock.lockState === "WL") {
                    let flag = 0;
                    for (let i = 0; i < lock.lockTID.length; i++) {
                        if (transaction.TS < lock.lockTID[i]) {
                            flag = 1;
                            break;
                        }
                    }

                    if (flag === 1) {
                        transaction.wait.push(op);
                        transaction.state = "blocked";
                        this.transTable.set(transaction.TID, transaction);
                        lock.waitingTransactions.push(op);
                        this.lockTable.set(variable, lock);
                        console.log(`${op} T${TID} is blocked/waiting due to wait-die.`);
                        this.logToFile('output.txt', `${op} T${TID} is blocked/waiting due to wait-die.`);
                    } else {
                            transaction.state = "abort";
                            this.transTable.set(transaction.TID, transaction);
                            this.abortOperation(op);      
                    }
                }
            }
        }
    }

    writeOperation(op) {
        const TID = parseInt(op[1]);
        const transaction = this.transTable.get(TID);

        if (transaction.state === "abort") {
            console.log(`${op} T${TID} is already aborted.`);
            this.logToFile('output.txt', `${op} T${TID} is already aborted.`);
        } else if (transaction.state === "blocked") {
            transaction.wait.push(op);
        } else if (transaction.state === "active") {
            const match = /\((.*?)\)/.exec(op);
            const variable = match[1];

            if (!this.lockTable.has(variable)) {
                const lock = {
                    itemName: variable,
                    lockState: "WL",
                    lockTID: [TID],
                    waitingTransactions: []
                };

                this.lockTable.set(variable, lock);
                console.log(`${op} ${variable} is write locked by T${transaction.TID}.`);
                this.logToFile('output.txt', `${op} ${variable} is write locked by T${transaction.TID}.`);
                transaction.items.push(variable);
                this.transTable.set(transaction.TID, transaction);
            } else if (this.lockTable.has(variable)) {
                const lock = this.lockTable.get(variable);

                if (lock.lockTID.length === 1 && lock.lockTID[0] === TID) {
                    lock.lockState = "WL";
                    this.lockTable.set(variable, lock);
                    console.log(`${op} read lock on ${variable} by T${transaction.TID} is upgraded to write lock.`);
                    this.logToFile('output.txt', `${op} read lock on ${variable} by T${transaction.TID} is upgraded to write lock.`);
                } else {
                    let flag = 0;
                    for (let i = 0; i < lock.lockTID.length; i++) {
                        if (transaction.TS < lock.lockTID[i]) {
                            flag = 1;
                            break;
                        }
                    }

                    if (flag === 1) {
                        transaction.wait.push(op);
                        transaction.state = "blocked";
                        this.transTable.set(transaction.TID, transaction);
                        lock.waitingTransactions.push(op);
                        this.lockTable.set(variable, lock);
                        console.log(`${op} T${TID} is blocked/waiting due to wait-die.`);
                        this.logToFile('output.txt', `${op} T${TID} is blocked/waiting due to wait-die.`);
                    } else {
                        transaction.state = "abort";
                        this.transTable.set(transaction.TID, transaction);
                        this.abortOperation(op);
                    }
                }
            }
        }
    }

    endOperation(op, flag) {
        const TID = parseInt(op[1]);
        const transaction = this.transTable.get(TID);
    
        if (transaction.state === "abort" && flag === 0) {
            console.log(`${op} T${TID} is already aborted.`);
            this.logToFile('output.txt', `${op} T${TID} is already aborted.`);
        } else if (transaction.state === "blocked") {
            const waiting = transaction.wait;
            for (let g = 0; g <= waiting.length; g++){
                if (op === waiting[g])
                {
                    console.log(`${op} T${TID} is released from operation list. T${TID} is committed.`);
                    this.logToFile('output.txt', `${op} is released from operation list. T${TID} is committed.`);
                    this.committ.push(`T${TID}`);
                    transaction.state = "committed";
    
                    break;
                }
            }
            if (transaction.state !== "committed"){
                transaction.wait.push(op);
                console.log(`${op} Committing T${TID} is added to operation list.`); 
                this.logToFile('output.txt', `${op} Committing T${TID} is added to operation list.`); 
            }
        } else {
            if (flag === 0 || (transaction.state !== "abort" && transaction.state !== "committed")) {
                console.log(`${op} T${TID} is committed.`);
                this.logToFile('output.txt', `${op} T${TID} is committed.`);
                this.committ.push(`T${TID}`);
                transaction.state = "committed";
    
                // Create an array to store the keys of the items to be removed.
                const keysToRemove = [];
                const items = transaction.items;
    
                for (let a = 0; a < items.length; a++) { //test
                    const currLockTable = this.lockTable.get(items[a]); //test
                    if (currLockTable) { //test
                        const lockTID = currLockTable.lockTID; //test
                        for (let b = 0; b < lockTID.length; b++){ //test
                            if (lockTID[b] === TID){ //test
                                keysToRemove.push(items[a]); //test
                                break; // Remove the item once we find it in the lockTID array
                            }
                        }
                    }
                } 
                for (const key of keysToRemove) {
                    this.lockTable.delete(key);
                }
            }
    
            transaction.items = [];
            this.transTable.set(TID, transaction);
            const items = transaction.items;
    
            for (let i = 0; i < items.length; i++) {
                const currLockTable = this.lockTable.get(items[i]);
    
                if (currLockTable) {
                    const lockTID = currLockTable.lockTID;
    
                    for (let j = 0; j < lockTID.length; j++) {
                        if (lockTID[j] === TID) {
                            lockTID.splice(j, 1);
                        }
                    }
    
                    const waitList = currLockTable.waitingTransactions;
    
                    currLockTable.lockTID = lockTID;
    
                    if (lockTID.length === 0 && waitList.length === 0) {
                        this.lockTable.delete(items[i]);
                    } else {
                        this.lockTable.set(items[i], currLockTable);
                    }
    
                    if (waitList.length > 0) {
                        const changedList = [];
    
                        for (let k = 0; k < waitList.length; k++) {
                            const waitTID = parseInt(waitList[k][1]);
                            const match = /\((.*?)\)/.exec(waitList[k]);
                            const variable = match[1];
    
                            if (currLockTable.lockTID.length === 0) {
                                currLockTable.lockTID.push(waitTID);
    
                                if (waitList[k].startsWith("w")) {
                                    currLockTable.lockState = "WL";
                                    console.log(`${waitList[k]} T${waitTID} is released from operation list. ${variable} is write locked by T${waitTID}. T${waitTID} is committed.`);
                                    this.logToFile('output.txt', `${waitList[k]} T${waitTID} is released from operation list. ${variable} is write locked by T${waitTID}. T${waitTID} is committed.`);
                                    this.committ.push(`T${TID}`);
                                    transaction.state = "committed";
                                } else if (waitList[k].startsWith("r")) {
                                    currLockTable.lockState = "RL";
                                    console.log(`${waitList[k]} T${waitTID} is released from operation list. ${variable} is read locked by T${waitTID}. T${waitTID} is committed.`);
                                    this.logToFile('output.txt', `${waitList[k]} T${waitTID} is released from operation list. ${variable} is read locked by T${waitTID}. T${waitTID} is committed.`);
                                    this.committ.push(`T${TID}`);
                                    transaction.state = "committed";
                                }
                                changedList.push(waitList[k]);
                                waitList.splice(k, 1);
                            } else if (currLockTable.lockTID.length >= 1 && currLockTable.lockState === "RL" && waitList[k].startsWith("r")) {
                                currLockTable.lockTID.push(waitTID);
                                console.log(`${waitList[k]} T${waitTID} is released from operation list. ${variable} is write locked by T${waitTID}. T${waitTID} is committed.`);
                                this.logToFile('output.txt', `${waitList[k]} T${waitTID} is released from operation list. ${variable} is write locked by T${waitTID}. T${waitTID} is committed.`);
                            } else if (currLockTable.lockTID.length === 1 && currLockTable.lockState === "RL" && waitTID === currLockTable.lockTID[0] && waitList[k].startsWith("w")) {
                                currLockTable.lockState = "WL";
                                changedList.push(waitList[k]);
                                waitList.splice(k, 1);
                                console.log(`${waitList[k]} T${waitTID} is released from operation list. Read lock on ${variable} by T${waitTID} is upgraded to write lock.`);
                                this.logToFile('output.txt', `${waitList[k]} T${waitTID} is released from operation list. Read lock on ${variable} by T${waitTID} is upgraded to write lock.`);
                            }
    
                            currLockTable.waitingTransactions = waitList;
                            this.lockTable.set(variable, currLockTable);
                        }
    
                        for (let l = 0; l < changedList.length; l++) {
                            const currTID = parseInt(changedList[l][1]);
                            const match = /\((.*?)\)/.exec(changedList[l]);
                            const variable = match[1];
                            const currTransTable = this.transTable.get(currTID);
                            const itemHeld = currTransTable.items;

                            itemHeld.push(variable);
                            const wait = currTransTable.wait;

                        for (let m = 0; m < wait.length; m++) {
                            if (wait[m] === changedList[l]) {
                                wait.splice(m, 1);
                            }
                        }

                        if (wait.length === 0) {
                            currTransTable.state = "active";
                        } else if (wait.length === 1 && wait[0].startsWith("e")) {
                            currTransTable.state = "active";
                            this.transTable.set(currTID, currTransTable);
                            this.endOperation(wait[0], 0);
                        }

                        currTransTable.wait = wait;
                        currTransTable.items = itemHeld;
                        this.transTable.set(currTID, currTransTable);
                    }
                } else {
                    this.lockTable.delete(items[i]);
                }
            }
        }
    }
}

    abortOperation(op) {
        const TID = parseInt(op[1]);
        console.log(`${op} T${TID} is aborted due to wait-die.`);
        this.logToFile('output.txt', `${op} T${TID} is aborted due to wait-die.`);
        this.aborts.push(`T${TID}`);
        const status = 1;
        let nop = op;
        for (let i = 0; i < TID; i++){
            if (this.transTable.has(i)){
                nop = "e" + i + ";";
                this.unblockOperation(nop);
            }
        }
        this.endOperation(op, status);
        
    }

    unblockOperation(op){
        const TID = parseInt(op[1]);
        const transaction = this.transTable.get(TID);
        if (transaction.state === "blocked"){
            this.endOperation(op, 0);
        }
    }

    static main() {
        const simulation = new TwoPhaseLocking();

        const fileContent = fs.readFileSync('input3.txt', 'utf-8');
        const input = fileContent.split('\n').map(line => line.trim());
        //console.log(input);
        

        try {
            // Assuming the input file is read from the standard input
            //const input1 = ["b1;","r1(Y);","w1(Y);","r1(Z);","b2;","r2(Y);","b3;","r3(Z);","w1(Z);","e1;","w3(Z);","e1;","e3;"] 
           //const input2 = ["b1;","r1(Y);","w1(Y);","r1(Z);","b3;","r3(X);","w3(X);","w1(Z);","e1;","r3(Y);","b2;","r2(Z);","w2(Z);","w3(Y);","e3;","r2(X);","w2(X);","e2;"];
           //const inputD = ["b1;","r1(Y);","w1(Y);","r1(Z);","b3;","r3(X);","w3(X);","w1(Z);","e1;","r3(Y);","b2;","r2(Z);","w2(Z);","w3(Y);","e3;","r2(X);","w2(X);","e2;"]; 

            for (let i = 0; i < input.length; i++) {
                const op = input[i];
                simulation.startOperation(op);
            }

            // Print the committed and aborted transactions
            console.log("\nFinal State:");
            console.log("Committed: " + (simulation.committ.length === 0 ? "None " : simulation.committ.join(", ")) + 
            " Aborted: " + (simulation.aborts.length === 0 ? "None" : simulation.aborts.join(", ")));
        } catch (e) {
            console.error(e);
        }
    }
}

TwoPhaseLocking.main();