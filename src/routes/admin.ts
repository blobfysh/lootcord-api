import { Router, Request, Response } from 'express'
import Joi from 'joi'
import validate from '../middleware/validate'
import { checkAdmin } from '../middleware/auth'
import redis from '../utils/redis'
import { redisSign } from '../utils/jwt'

const router = Router()

router.use(checkAdmin)

const guildParamSchema = Joi.object({
	id: Joi.string().required().label('Guild ID')
})

router.post('/guilds/:id/reset', validate(guildParamSchema, 'params'), async (req: Request, res: Response) => {
	try {
		const token = await redisSign(req.params.id, {
			guildID: req.params.id
		})

		res.status(200).json({ token })
	}
	catch (err) {
		res.sendStatus(500)
	}
})

router.post('/guilds/:id/revoke', validate(guildParamSchema, 'params'), async (req: Request, res: Response) => {
	try {
		if (!await redis.get(`JWT|${req.params.id}`)) {
			res.status(400).json({ message: 'Token does not exist' })
			return
		}

		await redis.del(`JWT|${req.params.id}`)

		res.status(200).json({ message: 'Successfully revoked token' })
	}
	catch (err) {
		res.sendStatus(500)
	}
})

export default router
