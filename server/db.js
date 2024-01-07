import path from 'path'
import knex from 'knex'

const dbPath = path.resolve('server/db/liveChat.db')

const config = {
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true
}

const knx = knex(config)

export { knx }
