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
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
    }

    createGenesisBlock() {
        return new Block(Date.now(), [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async addTransaction(from, to, product, quantity) {
        this.pendingTransactions.push({
            from,
            to,
            product,
            quantity,
            timestamp: Date.now()
        });
    }

    async minePendingTransactions() {
        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        await block.mineBlock(this.difficulty);
        
        this.chain.push(block);
        this.pendingTransactions = [];
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