export interface NodeFuckUp {
	start: number;
	end: number;
	isEnded: boolean;
}

export interface SuperhubNode {
	name: string;
	isDown: boolean;
	uptime: number;
	monitoringSince: number;
	fuckUps: NodeFuckUp[];
}

export type SuperhubNodes = SuperhubNode[];
