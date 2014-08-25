CREATE (tabu:Business{
					uuid: '64e962aa-40fd-4a00-a70a-c0c86cf5c510',
					name: 'Tabu Lounge & Sports Bar'
				})

CREATE (tabuLocation:BusinessLocation{
					uuid: 'edb29ade-e794-4c95-94b9-d4448a1e4b85',
					name: 'Tabu Lounge & Sports Bar',
					lat: 39.948429,
					lon: -75.160631
				})

CREATE (tabu)-[:Location]->(tabuLocation)