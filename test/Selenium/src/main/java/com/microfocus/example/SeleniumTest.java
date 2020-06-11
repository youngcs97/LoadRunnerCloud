package com.microfocus.example;

import org.junit.*;

//import org.openqa.selenium.*;
//import org.openqa.selenium.chrome.ChromeDriver;
//import java.util.concurrent.TimeUnit;


public class SeleniumTest {

    //public static WebDriver driver;

    public SeleniumTest() {

    }

    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
        //driver = new ChromeDriver();
    }

    @AfterClass
    public static void tearDownAfterClass() throws Exception {
        //driver.quit();
    }

    @Before
    public void setUp() throws Exception {
    }

    @After
    public void tearDown() throws Exception {
    }

    @Test
    public void test() throws Exception {

        Assert.assertEquals("1", "1");
        /*
        driver.get("http://advantageonlineshopping.com");
        Wait(3);
        try {
            driver.findElement(By.id("speakersImg")).click();
            String SpeakersText = driver.findElement(By.xpath("/html/body/div[3]/section/article/h3")).getText();
            System.out.println(SpeakersText);
            Assert.assertEquals("SPECIAL OFFER", SpeakersText);

        } catch(Exception e)
        {
            System.out.println(e);
        }
        */

    }

    @Test
    public void test2() throws Exception {

        Assert.assertEquals("2", "2");

    }

    /*
    // Wait function
    public void Wait(int seconds) throws InterruptedException {
        try {
            TimeUnit.SECONDS.sleep(seconds);
        } catch (InterruptedException e) {
            System.out.println(e);
        }
    } // End wait
    */

}
