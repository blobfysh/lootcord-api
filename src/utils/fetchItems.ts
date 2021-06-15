import fetch from 'node-fetch'

let itemdata: { [key: string]: any } = {}

async function fetchItems (): Promise<void> {
	try {
		if (process.env.LOOTCORD_BOT_API_URL && process.env.LOOTCORD_BOT_API_AUTH) {
			const res = await fetch(`${process.env.LOOTCORD_BOT_API_URL}/api/items`, {
				method: 'POST',
				headers: {
					'Authorization': process.env.LOOTCORD_BOT_API_AUTH,
					'Content-Type': 'application/json'
				}
			})

			itemdata = await res.json()
		}
	}
	catch (err) {
		console.log(err)
	}
}

export { itemdata, fetchItems }

