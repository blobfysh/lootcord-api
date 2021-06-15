interface Payload {
	guildID: string
	iat: number
}

declare namespace Express {
	export interface Request {
		payload?: Payload
	}
}
