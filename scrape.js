import puppeteer from "puppeteer";
//var sqlite3 = require('sqlite3').verbose();




function create_db()
{
    db.serialize(function() {
        db.run("CREATE TABLE books_data (book_name, price, genre )");
    });
    
    db.close();

}


function insertData(title, price, category){
    var insertQuery = db.prepare("INSERT INTO books_data VALUES (?,?,?)");
    insertQuery.run(title, price, category);
    console.log("Data inserted successfully...");
    insertQuery.finalize();
}



const genre_data = async (page)=>{

   const list =  await page.$$('.side_categories ul ul li')
   console.log(list.length)
   var name_list=[]
   var url_list=[]
   for(let i=0;i<list.length;i++)
   {
        var genre_name = await list[i].$eval('a',node => node.innerText )
        var genre_url = await list[i].$eval('a', node=> node.href)
        
        name_list.push(genre_name)
        url_list.push(genre_url)
   }

   return [name_list, url_list]
};



const scrape_books = async (page, book_genre, next_flag)=>{

    const books_list = await page.$$('.col-lg-3')

    for(let i=0; i<books_list.length;i++)
    {
       var title = await books_list[i].$eval('h3 a', node=>node.title)
       var price = await books_list[i].$eval('.price_color', node=>node.innerText)
       var category = book_genre
       console.log(title, price, category)  //use  save_data_in_db()
    //    db.serialize(()=>{insertData(title, price, category);});
    //    db.close();
       
    }

    if(next_flag != null)
    {
        await page.click('.next a')
        const next_present= await page.$('.next', {
            waitUntil: "domcontentloaded",
          })
        await scrape_books(page, book_genre, next_present)
    }

};



const scrape_each_genre = async (page, genre_data, browser)=>{

    for(let i=0; i<genre_data[1].length; i++)
    {
        await page.goto(genre_data[1][i], {
            waitUntil: "domcontentloaded",
          });
        
        const next_present= await page.$('.next')
        await scrape_books(page, genre_data[0][i], next_present)
          
    }

};


const process_scrape_books = async () => {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    const page = await browser.newPage();
  
    await page.goto("https://books.toscrape.com/", {
      waitUntil: "domcontentloaded",
    });


    var genre_list =await genre_data(page)

    await scrape_each_genre(page, genre_list, browser)

    page.close()
    browser.close()

  };
  
 export function books_data_scraper()
 {
    process_scrape_books();
 }

 //create_db()
 books_data_scraper()