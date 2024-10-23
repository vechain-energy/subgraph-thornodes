import {
	LevelChanged as LevelChangedEvent,
	AuctionSuccessful as AuctionSuccessfulEvent,
	AuctionCreated as AuctionCreatedEvent,
	AuctionCancelled as AuctionCancelledEvent,
} from '../generated/ThorNode/IThorNode'

import {
	fetchERC721Token,
	fetchERC721
} from './erc721'

import {
	fetchAccount
} from './account'

import {
	events,
	transactions,
} from '@amxx/graphprotocol-utils'

import { AuctionSuccessful, Auction } from '../generated/schema'

export function handleLevelChanged(event: LevelChangedEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let token = fetchERC721Token(contract, event.params._tokenId)
		token.level = event.params._toLevel
		token.save()
	}
}

export function handleAuctionSuccessful(event: AuctionSuccessfulEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let token = fetchERC721Token(contract, event.params._tokenId)
		let seller = fetchAccount(event.params._seller)
		let winner = fetchAccount(event.params._winner)

		token.owner = winner.id
		token.save()

		let auctionSuccess = new AuctionSuccessful([event.params._auctionId.toString(),'success'].join('/'))
		auctionSuccess.transaction = transactions.log(event).id
		auctionSuccess.timestamp = event.block.timestamp
		auctionSuccess.emitter = event.address
		auctionSuccess.auctionId = event.params._auctionId
		auctionSuccess.token = token.id
		auctionSuccess.seller = seller.id
		auctionSuccess.winner = winner.id
		auctionSuccess.finalPrice = event.params._finalPrice
		auctionSuccess.save()

		const auction = Auction.load(event.params._auctionId.toString())!
		auction.successful = true;
		auction.save()
	}
}


export function handleAuctionCreated(event: AuctionCreatedEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let token = fetchERC721Token(contract, event.params._tokenId)
		let seller = fetchAccount(event.transaction.from)

		let auction = new Auction(event.params._auctionId.toString())
		auction.transaction = transactions.log(event).id
		auction.timestamp = event.block.timestamp
		auction.emitter = event.address
		auction.auctionId = event.params._auctionId
		auction.token = token.id
		auction.seller = seller.id
		auction.startingPrice = event.params._startingPrice
		auction.endingPrice = event.params._endingPrice
		auction.duration = event.params._duration
		auction.cancelled = false
		auction.successful = false
		auction.save()
	}
}

export function handleAuctionCanceled(event: AuctionCancelledEvent): void {
	const auction = Auction.load(event.params._auctionId.toString())
	if (auction) {
		auction.cancelled = true
		auction.save()
	}
}
