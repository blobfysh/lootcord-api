import { Query, PlayerRow } from '../types/mysql'
import { itemdata } from '../utils/fetchItems'

export async function addItem (query: Query, userID: string, item: string, amount: number, serverSideGuildId?: string): Promise<void> {
	if (serverSideGuildId) {
		const insertValues = Array(amount).fill([userID, serverSideGuildId, item])

		await query('INSERT INTO server_user_items (userId, guildId, item) VALUES ?', [insertValues])
	}
	else {
		const insertValues = Array(amount).fill([userID, item])

		await query('INSERT INTO user_items (userId, item) VALUES ?', [insertValues])
	}
}

export async function removeItem (query: Query, userID: string, item: string, amount: number, serverSideGuildId?: string): Promise<void> {
	if (serverSideGuildId) {
		await query('DELETE FROM server_user_items WHERE userId = ? AND guildId = ? AND item = ? LIMIT ?', [userID, serverSideGuildId, item, amount])
	}
	else {
		await query('DELETE FROM user_items WHERE userId = ? AND item = ? LIMIT ?', [userID, item, amount])
	}
}

export function getItemCount (userItems: { [key: string]: number }, userRow: PlayerRow): {
	totalItems: number
	banners: number
	max: number
	open: number
} {
	let totalItems = 0
	let banners = 0

	for (const item in userItems) {
		if (itemdata[item] && userItems[item] > 0) {
			if (itemdata[item].category === 'Banner') {
				banners += userItems[item]
			}
			else {
				totalItems += userItems[item]
			}
		}
	}

	if (itemdata[userRow.banner]) {
		banners++
	}

	return {
		totalItems,
		banners,
		max: 15 + userRow.inv_slots,
		open: Math.max(0, (15 + userRow.inv_slots) - totalItems)
	}
}
