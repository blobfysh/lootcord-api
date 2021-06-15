import express from 'express'
import routes from './routes'
import { fetchItems } from './utils/fetchItems'

const app = express()
const PORT = process.env.PORT || 7000

async function start () {
	// fetch items and update them daily
	await fetchItems()
	setInterval(() => {
		fetchItems().then(() => {
			console.log('Successfully updated items')
		}).catch(err => {
			console.log(err)
		})
	}, 86400 * 1000)

	// set up middleware
	app.use(express.urlencoded({ extended: false }))
	app.use(express.json())

	// set up routes
	app.use('/vote', routes.vote)
	app.use('/guilds', routes.guilds)
	app.use('/admin', routes.admin)

	app.get('/', (req, res) => {
		res.send('Hello!')
	})

	// start app
	app.listen(PORT, () => {
		console.log(`Server running on port: ${PORT}`)
	})
}

start()
