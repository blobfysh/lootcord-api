import { sign } from 'jsonwebtoken'
import redis from './redis'

// storing the tokens in redis allows me to manually invalidate tokens

export async function redisVerify (jwt: string, identifier: string): Promise<boolean> {
	if (await redis.get(`JWT|${identifier}`) !== jwt) {
		throw new Error('Token is invalid')
	}

	return true
}

export async function redisSign (identifier: string, payload: any): Promise<string> {
	const token = sign(payload, process.env.JWT_SECRET || 'test')

	await redis.set(`JWT|${identifier}`, token)

	return token
}
