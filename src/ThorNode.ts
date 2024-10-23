import {
	LevelChanged as LevelChangedEvent,
} from '../generated/ThorNode/IThorNode'

import {
	fetchERC721Token,
	fetchERC721
} from './erc721'

export function handleLevelChanged(event: LevelChangedEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let token = fetchERC721Token(contract, event.params._tokenId)
		token.level = event.params._toLevel
		token.save()
	}
}