import { createPool, Pool } from 'mysql2/promise';
import { configDotenv } from 'dotenv';

configDotenv({
    path: "./.env"
});

const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: 'Deep@1998#',
    database:'chatapp',
};

class MySQLBot {
    pool: Pool;

    constructor() {
        this.pool = createPool(dbConfig);
    }

    async init(): Promise<void> {
        try {
            const connection = await this.pool.getConnection();
            console.log('MySQL connected');
            connection.release();
        } catch (error) {
            console.error('Error connecting to MySQL:', error);
            throw error; // Re-throw error to handle it at the caller level
        }
    }

    async query(sql: string, params: any[] = []) {
        const [results] = await this.pool.query(sql, params);
        return results;
    }

    async findOneAndUpdate(table: string, condition: string, conditionParams: any[], updateFields: object) {
        
        const setClause = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
        console.log('setClause: ', JSON.stringify(setClause));
        const values = [...Object.values(updateFields), ...conditionParams];
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${condition}`;

        await this.query(sql, values);
    }

    async findOne(table: string, condition: string, params: any[]) {
        const sql = `SELECT * FROM ${table} WHERE ${condition}`;
        const results:any = await this.query(sql, params);
        return results[0];
    }
}

export default new MySQLBot();
