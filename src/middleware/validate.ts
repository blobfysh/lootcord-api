import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

interface Errors {
	[key: string]: string
}

// middleware used to validate Joi schemas, will respond with errors if schema fails to validate
export default (schema: Joi.Schema, type: 'body' | 'query' | 'params') => (req: Request, res: Response, next: NextFunction): void => {
	const { error, value } = schema.validate(req[type], {
		abortEarly: false
	})

	if (!error) {
		req[type] = value
		next()
	}
	else {
		const { details } = error
		console.log(details)

		// custom formatting for errors, using reduce to create an object
		const formattedErrors = details.reduce<Errors>((prev, curr) => ({
			...prev,
			[curr.path[0]]: curr.message
		}), {})

		res.status(400).json(formattedErrors)
	}
}
