export interface PingInformation {
	isOnline: boolean;
	time: number;
}

export interface FetchedKumaNode {
	id: number;
	name: string;
	pings: PingInformation[];
}
export type FetchedKumaData = FetchedKumaNode[];

export interface InternalKumaNodeData {
	id: number;
	name: string;
	sendUrl: 0 | 1; // is `url` defined (ig)
	url?: string;
}

export interface InternalKumaData {
	config: object; // don't need it now
	incident: unknown; // don't need it now
	maintenanceList: []; // idk what it is, probably don't need it now
	publicGroupList: {
		id: number; // web - 3, nodes - 4, databases - 5
		name: string;
		weight: number;
		monitorList: InternalKumaNodeData[];
	}[];
}
