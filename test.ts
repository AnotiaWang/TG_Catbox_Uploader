async function fetchData(page: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`Page: ${page}`)
    }, 1000)
  })
}

async function* asyncDataGenerator(pages: number) {
  for (let i = 1; i <= pages; i++) {
    yield await fetchData(i)
  }
}

;(async () => {
  const generator = asyncDataGenerator(4)
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log(await generator.next())
  console.log(await generator.next())
  console.log(await generator.next())
  await generator.return()
  console.log(await generator.next())
  console.log(await generator.next())
  // for await (const data of generator) {
  //   console.log(data)
  // }
})()
