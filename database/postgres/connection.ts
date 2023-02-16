import pgPromise from "pg-promise";
import { createSingleton } from "./singleObject";
const pgp = pgPromise({})

const cn = {
    host: 'localhost',
    port: 5432,
    user: '',
    password: '',
    database: ''
}

interface IDatabaseScope {
    db: pgPromise.IDatabase<any>;
    pgp: pgPromise.IMain;
}

export function getDB(): IDatabaseScope {
    return createSingleton<IDatabaseScope>('Audit', () => {
        return { db: pgp(cn), pgp };
    });
}
