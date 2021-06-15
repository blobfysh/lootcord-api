import redis from './redis'
import { Query, PlayerRow } from '../types/mysql'

export async function getRow (query: Query, userID: string, serverSideGuildId?: string, forUpdate = false): Promise<PlayerRow | undefined> {
	if (serverSideGuildId) {
		return (await query(`SELECT * FROM server_scores WHERE userId = ? AND guildId = ? AND userId > 0${forUpdate ? ' FOR UPDATE' : ''}`, [userID, serverSideGuildId]))[0]
	}

	return (await query(`SELECT * FROM scores WHERE userId = ? AND userId > 0${forUpdate ? ' FOR UPDATE' : ''}`, [userID]))[0]
}

export async function getItemObject (query: Query, userID: string, serverSideGuildId?: string, forUpdate = false): Promise<{ [key: string]: number }> {
	const itemObj: { [key: string]: number } = {}
	let itemRows: { item: string, amount: number }[]

	if (serverSideGuildId) {
		itemRows = await query(`SELECT item, COUNT(item) AS amount FROM server_user_items WHERE userId = ? AND guildId = ? GROUP BY item${forUpdate ? ' FOR UPDATE' : ''}`, [
			userID,
			serverSideGuildId
		])
	}
	else {
		itemRows = await query(`SELECT item, COUNT(item) AS amount FROM user_items WHERE userId = ? GROUP BY item${forUpdate ? ' FOR UPDATE' : ''}`, [
			userID
		])
	}

	for (const row of itemRows) {
		itemObj[row.item] = row.amount
	}

	return itemObj
}

export async function messageUser (userID: string, message: any): Promise<void> {
	await redis.publish('messageUser', JSON.stringify({
		shard: 0,
		id: userID,
		content: message
	}))
}
