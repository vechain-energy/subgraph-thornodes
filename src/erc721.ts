import {
    Address,
    BigInt,
    Bytes,
} from '@graphprotocol/graph-ts'

import {
    Account,
    ThorNodeContract,
    ThorNode,
    ThorNodeOperator,
} from '../generated/schema'

import {
    IERC721,
} from '../generated/erc721/IERC721'

import {
    IThorNode,
} from '../generated/erc721/IThorNode'

import {
    fetchAccount
} from './account'

import {
    supportsInterface,
} from '../node_modules/@openzeppelin/subgraphs/src/fetch/erc165'
export function fetchERC721(address: Address): ThorNodeContract | null {
    let erc721 = IERC721.bind(address)

    // Try load entry
    let contract = ThorNodeContract.load(address)
    if (contract != null) {
        return contract
    }

    // Detect using ERC165
    let detectionId = address.concat(Bytes.fromHexString('80ac58cd')) // Address + ERC721
    let detectionAccount = Account.load(detectionId)

    // On missing cache
    if (detectionAccount == null) {
        detectionAccount = new Account(detectionId)
        // let introspection_01ffc9a7 = supportsInterface(erc721, '01ffc9a7') // ERC165
        // let introspection_80ac58cd = supportsInterface(erc721, '80ac58cd') // ERC721
        // let introspection_00000000 = supportsInterface(erc721, '00000000', false)
        let isERC721 = true // introspection_01ffc9a7 && introspection_80ac58cd && introspection_00000000
        detectionAccount.asThorNode = isERC721 ? address : null
        detectionAccount.save()
    }

    // If an ERC721, build entry
    if (detectionAccount.asThorNode) {
        contract = new ThorNodeContract(address)
        let try_name = erc721.try_name()
        let try_symbol = erc721.try_symbol()
        contract.name = try_name.reverted ? '' : try_name.value
        contract.symbol = try_symbol.reverted ? '' : try_symbol.value
        contract.supportsMetadata = supportsInterface(erc721, '5b5e139f') // ERC721Metadata
        contract.asAccount = address
        contract.save()

        let account = fetchAccount(address)
        account.asThorNode = address
        account.save()
    } else {
    }

    return contract
}

export function fetchERC721Token(contract: ThorNodeContract, identifier: BigInt): ThorNode {
    let id = contract.id.toHex().concat('/').concat(identifier.toHex())
    let token = ThorNode.load(id)

    if (token == null) {
        token = new ThorNode(id)
        token.contract = contract.id
        token.identifier = identifier
        token.approval = fetchAccount(Address.zero()).id
        token.level = 0
        token.isX = false

        let thorNode = IThorNode.bind(Address.fromBytes(contract.id))
        let try_getMetadata = thorNode.try_getMetadata(identifier)
        token.isX = try_getMetadata.reverted ? false : try_getMetadata.value.getValue1() >= 4
        token.level = try_getMetadata.reverted ? false : try_getMetadata.value.getValue1()

        if (contract.supportsMetadata) {
            let erc721 = IERC721.bind(Address.fromBytes(contract.id))
            let try_tokenURI = erc721.try_tokenURI(identifier)
            token.uri = try_tokenURI.reverted ? '' : try_tokenURI.value
        }
    }

    return token as ThorNode
}

export function fetchERC721Operator(contract: ThorNodeContract, owner: Account, operator: Account): ThorNodeOperator {
    let id = contract.id.toHex().concat('/').concat(owner.id.toHex()).concat('/').concat(operator.id.toHex())
    let op = ThorNodeOperator.load(id)

    if (op == null) {
        op = new ThorNodeOperator(id)
        op.contract = contract.id
        op.owner = owner.id
        op.operator = operator.id
    }

    return op as ThorNodeOperator
}
