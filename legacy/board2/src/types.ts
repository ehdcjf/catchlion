export enum PlayerSide {
	me = 0,
	you = 1,
}

export enum PieceType {
	chick = 0,
	chicken = 1,
	elephant = 2,
	giraffe = 3,
	lion = 4,
}

export const pieceColor: { [key in PieceType]: string } = {
	0: 'Yellow',
	1: 'Red',
	2: 'Green',
	3: 'Pink',
	4: 'Black',
};
