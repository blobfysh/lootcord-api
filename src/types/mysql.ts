import { QueryOptions } from 'mysql'

export type Query = (sql: string | QueryOptions, args?: any[]) => Promise<any>

export interface Transaction {
	query: Query
	commit(): Promise<string>
}

export interface PlayerRow {
	userId: string
	createdAt: number
	level: number
	health: number
	maxHealth: number
	scaledDamage: number
	inv_slots: number
	backpack: string
	armor: string
	ammo: string
	badge: string
	money: number
	points: number
	kills: number
	deaths: number
	stats: number
	luck: number
	used_stats: number
	status: string
	banner: string
	language: string
	voteCounter: number
	clanId: number
	clanRank: number
	lastActive: Date
	notify1: number
	notify2: number
	notify3: number
	prestige: number
	discoinLimit: number
	bmLimit: number
	bleed: number
	burn: number
}
