CREATE (andrew:User{uuid: '5ee41b6f-758a-4bb5-95ae-0a4bf5444bf1',
					 displayName: 'Andrew Madonna',
					 familyName: 'Madonna',
					 givenName: 'Andrew',
					 middleName: 'William',
					 userType: 'company'
					})

CREATE (localProvider:LocalProvider{
						uuid: '8d90c28a-6e32-456c-8726-fde9116eff00',
						username: 'amadonna',
						passwordHash: '7363727970740000000000080000000146415f88653e40e5736c6e72f6e565c0fe5468af472029cc64b87c4e5e81b0e73e1bffe0ff7eab5eec29d410c393d2ed8d5c06d5a93222f50c5236d755f29234a9912ac04f725383d401c431afe1ecc9'
					})

CREATE (secondFactor:SecondFactor{
						uuid: '4d80bfb7-237d-4358-92e2-9c58c02afdc4',
						type: 'TOPT',
						name: 'Android Phone',
						value: 'EMUVCODBJNTC4JTLLU2VGM3RKZDEWNBFHNJDAWZSNFUWWZS6EY5A'
					})

CREATE (secondFactor)<-[:SecondFactor]-(andrew)-[:Provider]->(localProvider)