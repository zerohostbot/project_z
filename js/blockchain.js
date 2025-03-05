class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return crypto.subtle.digest('SHA-256', 
            new TextEncoder().encode(
                this.previousHash + 
                this.timestamp + 
                JSON.stringify(this.transactions) + 
                this.nonce
            )
        ).then(buffer => {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }

    async mineBlock(difficulty) {
        while(true) {
            const hash = await this.calculateHash();
            if(hash.substring(0, difficulty) === Array(difficulty + 1).join("0")) {
                this.hash = hash;
                break;
            }
            this.nonce++;
        }
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.difficulty = 1;
        this.createGenesisBlock();
    }

    createGenesisBlock() {
        const genesisBlock = {
            timestamp: Date.now(),
            transactions: [],
            previousHash: "0",
            hash: this.calculateHash({
                timestamp: Date.now(),
                transactions: [],
                previousHash: "0",
                nonce: 0
            }),
            nonce: 0
        };
        this.chain.push(genesisBlock);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    calculateHash(block) {
        const data = block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce;
        let hash = '';
        for (let i = 0; i < data.length; i++) {
            hash += data.charCodeAt(i).toString(16);
        }
        return hash;
    }

    async addTransaction(from, to, data, status) {
        this.pendingTransactions.push({
            from,
            to,
            data,
            status,
            timestamp: Date.now()
        });
    }

    async minePendingTransactions() {
        const block = {
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            previousHash: this.getLatestBlock().hash,
            nonce: 0
        };

        block.hash = this.calculateHash(block);
        this.chain.push(block);
        this.pendingTransactions = [];
        
        return block;
    }

    async isChainValid() {
        for(let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if(currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            const hash = await currentBlock.calculateHash();
            if(currentBlock.hash !== hash) {
                return false;
            }
        }
        return true;
    }
} 