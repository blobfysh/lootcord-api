import { Router, Request, Response } from 'express'
import Joi from 'joi'
import rateLimit from 'express-rate-limit'
import validate from '../middleware/validate'
import { checkJWT } from '../middleware/auth'
import { beginTransaction } from '../utils/mysql'
import { getRow, getItemObject } from '../utils/players'
import { addItem, removeItem, getItemCount } from '../utils/items'
import { itemdata } from '../utils/fetchItems'

const router = Router()

const itemBodySchema = Joi.object({
	user: Joi.string().min(10).max(30).required().label('User'),
	item: Joi.string().required().label('Item'),
	amount: Joi.number().min(1).max(100).required().label('Amount')
}).unknown(true)
const itemParamSchema = Joi.object({
	id: Joi.string().required().label('Guild ID')
})

// max 60 requests per minute
const itemsLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 60,
	message: {
		status: 429,
		message: 'Too many requests, please try again later.'
	}
})

router.post('/:id/items', validate(itemParamSchema, 'params'), checkJWT, validate(itemBodySchema, 'body'), itemsLimiter, async (req: Request, res: Response) => {
	try {
		const transaction = await beginTransaction()
		const row = await getRow(transaction.query, req.body.user, req.params.id, true)

		if (!row) {
			await transaction.commit()

			res.status(400).json({ message: 'There is no account in that server associated with that user ID' })
			return
		}
		else if (!itemdata[req.body.item]) {
			await transaction.commit()

			res.status(400).json({ message: 'That is not a valid item' })
			return
		}
		else if (itemdata[req.body.item].isSpecial) {
			await transaction.commit()

			res.status(400).json({ message: 'You cannot give limited items' })
			return
		}

		const userItems = await getItemObject(transaction.query, req.body.user, req.params.id, true)
		const itemCount = getItemCount(userItems, row)

		if (itemdata[req.body.item].category !== 'Banner' && itemCount.totalItems + req.body.amount > itemCount.max) {
			await transaction.commit()

			res.status(400).json({
				message: 'Adding that many items to that user would put them over their inventory limit',
				used: itemCount.totalItems,
				available: itemCount.open,
				max: itemCount.max
			})
			return
		}
		else if (itemdata[req.body.item].category === 'Banner' && itemCount.banners + req.body.amount > 100) {
			await transaction.commit()

			res.status(400).json({
				message: 'Adding that many banners to that user would put them over the banner limit (100)',
				used: itemCount.banners,
				available: 100 - itemCount.banners,
				max: 100
			})
			return
		}

		// actually adds item
		await addItem(transaction.query, req.body.user, req.body.item, req.body.amount, req.params.id)

		// finish tranaction
		await transaction.commit()

		if (itemdata[req.body.item].category === 'Banner') {
			res.status(200).json({
				message: 'Success',
				used: itemCount.banners + req.body.amount,
				available: 100 - (itemCount.banners + req.body.amount),
				max: 100
			})
		}
		else {
			res.status(200).json({
				message: 'Success',
				used: itemCount.totalItems + req.body.amount,
				available: itemCount.open - req.body.amount,
				max: itemCount.max
			})
		}
	}
	catch (err) {
		res.sendStatus(500)
	}
})

router.delete('/:id/items', validate(itemParamSchema, 'params'), checkJWT, validate(itemBodySchema, 'body'), itemsLimiter, async (req: Request, res: Response) => {
	try {
		const transaction = await beginTransaction()
		const row = await getRow(transaction.query, req.body.user, req.params.id, true)

		if (!row) {
			await transaction.commit()

			res.status(400).json({ message: 'There is no account in that server associated with that user ID' })
			return
		}
		else if (!itemdata[req.body.item]) {
			await transaction.commit()

			res.status(400).json({ message: 'That is not a valid item' })
			return
		}
		else if (itemdata[req.body.item].isSpecial) {
			await transaction.commit()

			res.status(400).json({ message: 'You cannot remove limited items' })
			return
		}

		const userItems = await getItemObject(transaction.query, req.body.user, req.params.id, true)
		// const itemCount = getItemCount(userItems, row)

		if (!userItems[req.body.item]) {
			await transaction.commit()

			res.status(400).json({
				message: 'User does not have that item',
				user: {
					items: userItems
				}
			})
			return
		}
		else if (userItems[req.body.item] < req.body.amount) {
			await transaction.commit()

			res.status(400).json({
				message: 'User does not have enough of that item',
				user: {
					items: userItems
				}
			})
			return
		}

		// actually removes item
		await removeItem(transaction.query, req.body.user, req.body.item, req.body.amount, req.params.id)

		// finish tranaction
		await transaction.commit()

		res.status(200).json({
			message: 'Success',
			user: {
				items: {
					...userItems,
					[req.body.item]: userItems[req.body.item] - req.body.amount
				}
			}
		})
	}
	catch (err) {
		res.sendStatus(500)
	}
})

export default router
