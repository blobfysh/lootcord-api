import { Request, Response, NextFunction } from 'express'
import { redisVerify } from '../utils/jwt'
import { verify } from 'jsonwebtoken'

export async function checkJWT (req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		if (!req.headers.authorization) {
			res.sendStatus(401)
			return
		}

		let payload: {
			guildID: string
			iat: number
		}

		try {
			payload = verify(req.headers.authorization, process.env.JWT_SECRET || 'test') as any

			await redisVerify(req.headers.authorization, payload.guildID)
		}
		catch (err) {
			res.status(401).json({ message: 'Invalid token' })
			return
		}

		req.payload = payload

		if (req.params.id !== req.payload.guildID) {
			res.status(401).json({ message: 'You are not authorized to make actions in this guild' })
			return
		}

		next()
	}
	catch (err) {
		res.sendStatus(500)
	}
}

export function checkAdmin (req: Request, res: Response, next: NextFunction): void {
	if (!req.headers.authorization || req.headers.authorization !== process.env.ADMIN_AUTH_TOKEN) {
		res.sendStatus(401)
		return
	}

	next()
}
