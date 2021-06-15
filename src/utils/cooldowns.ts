import redis from './redis'

interface SetCDOptions {
	armor?: string
	serverSideGuildId?: string
}

export async function setCD (userID: string, type: string, time: number, options: SetCDOptions = { serverSideGuildId: undefined }): Promise<string> {
	options.armor = options.armor || undefined
	options.serverSideGuildId = options.serverSideGuildId || undefined

	let key: string

	if (options.serverSideGuildId) {
		key = `${type}|${userID}|${options.serverSideGuildId}`
	}
	else {
		key = `${type}|${userID}`
	}

	if (await redis.get(key)) {
		return 'CD already exists.'
	}

	await redis.set(key, options.armor ? options.armor : `Set at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`, 'EX', Math.round(time / 1000))

	return 'Success'
}

interface GetCDOptions {
	serverSideGuildId?: string
}

export async function getCD (userID: string, type: string, options: GetCDOptions = { serverSideGuildId: undefined }): Promise<undefined | string | number> {
	options.serverSideGuildId = options.serverSideGuildId || undefined

	let key: string

	if (options.serverSideGuildId) {
		key = `${type}|${userID}|${options.serverSideGuildId}`
	}
	else {
		key = `${type}|${userID}`
	}

	const ttl = await redis.ttl(key)

	if (ttl <= 0) {
		return undefined
	}

	const endTime = Date.now() + (await redis.ttl(key) * 1000)
	const duration = endTime - Date.now()

	return duration
}
