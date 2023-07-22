export type FetchedKumaData = {
	id: number;
	name: string;
	isDown: boolean;
}[];

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
