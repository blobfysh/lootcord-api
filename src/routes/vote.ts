import { Router, Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import validate from '../middleware/validate'
import { beginTransaction } from '../utils/mysql'
import { getCD, setCD } from '../utils/cooldowns'
import { messageUser, getRow } from '../utils/players'
import { addItem } from '../utils/items'
import Embed from '../structures/Embed'

const router = Router()

function verifyAuth (req: Request, res: Response, next: NextFunction) {
	if (req.headers.authorization === process.env.VOTE_AUTH) {
		next()
	}
	else {
		res.sendStatus(401)
	}
}

const topggSchema = Joi.object({
	user: Joi.string().min(10).max(30).required().label('User')
}).unknown(true)

router.post('/topgg', verifyAuth, validate(topggSchema, 'body'), async (req: Request, res: Response) => {
	try {
		await sendVote(req.body.user, 'topgg')

		res.status(200).json({ message: 'Success' })
	}
	catch (err) {
		res.sendStatus(500)
	}
})

const dblSchema = Joi.object({
	id: Joi.string().min(10).max(30).required().label('ID')
}).unknown(true)

router.post('/dbl', verifyAuth, validate(dblSchema, 'body'), async (req: Request, res: Response) => {
	try {
		await sendVote(req.body.id, 'dbl')

		res.status(200).json({ message: 'Success' })
	}
	catch (err) {
		console.log(err)
		res.sendStatus(500)
	}
})


async function sendVote (userID: string, type: 'topgg' | 'dbl') {
	const voteCD = await getCD(userID, type === 'topgg' ? 'vote' : 'vote2')

	if (voteCD) {
		console.log(`[VOTE] Received vote but ignored it due to user having vote cooldown: ${userID}`)
		return
	}

	const transaction = await beginTransaction()
	const account = await getRow(transaction.query, userID, undefined, true)

	if (!account) {
		// TODO create account here?
		console.log('[VOTE] Received vote but ignored it due to user not having an account.')
		await transaction.commit()
		return
	}

	let itemReward: string

	if ((account.voteCounter + 1) % 6 === 0) {
		itemReward = '✨ You received a <:supply_signal:732853749181055027>`supply_signal` for voting 6 days in a row! 😃'

		await addItem(transaction.query, userID, 'supply_signal', 1)
	}
	else {
		itemReward = '📦 You received 1x <:military_crate:733720192114491394>`military_crate`!'

		await addItem(transaction.query, userID, 'military_crate', 1)
	}

	await setCD(userID, type === 'topgg' ? 'vote' : 'vote2', 43200 * 1000)

	await transaction.query('UPDATE scores SET voteCounter = voteCounter + 1 WHERE userId = ?', [userID])
	await transaction.commit()

	await messageUser(userID, {
		content: `**Thanks for voting!**\n${itemReward}`,
		embed: getCounterEmbed(account.voteCounter + 1).embed
	})
}

function getCounterEmbed (counterVal: number): Embed {
	const counterDayVal = counterVal % 6 === 0 ? 6 : counterVal % 6
	let rewardString = ''

	for (let i = 0; i < 5; i++) {
		// Iterate 5 times
		if (counterDayVal >= i + 1) {
			rewardString += `☑ Day ${i + 1}: \`military_crate\`\n`
		}
		else {
			rewardString += `❌ Day ${i + 1}: \`military_crate\`\n`
		}
	}

	if (counterVal % 6 === 0) {
		rewardString += '✨ Day 6: `supply_signal`'
	}
	else {
		rewardString += '❌ Day 6: `supply_signal`'
	}

	const embed = new Embed()
		.setTitle('Voting rewards!')
		.setDescription(rewardString)
		.setFooter('Vote 6 days in a row to receive a supply_signal!')
		.setColor(9043800)

	return embed
}

export default router
