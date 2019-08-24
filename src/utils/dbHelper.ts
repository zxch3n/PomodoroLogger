import nedb from 'nedb';

export class AsyncDB {
    constructor(private db: nedb) {}

    promisify(fn: Function) {
        return async (...args: any[]) => {
            return new Promise((resolve, reject) => {
                args.push((err: Error, ans?: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(ans);
                });

                fn.call(this.db, ...args);
            });
        };
    }

    async find(query?: any, projection?: any): Promise<any> {
        return await this.promisify(this.db.find)(query, projection);
    }

    async update(query: any, updateQuery: any, options: any = {}) {
        return await this.promisify(this.db.update)(query, updateQuery, options);
    }

    async findOne(...args: any): Promise<any> {
        return await this.promisify(this.db.findOne)(...args);
    }

    async count(...args: any) {
        return await this.promisify(this.db.count)(...args);
    }

    async insert(...args: any) {
        return await this.promisify(this.db.insert)(...args);
    }

    async remove(...args: any) {
        return await this.promisify(this.db.remove)(...args);
    }
}
