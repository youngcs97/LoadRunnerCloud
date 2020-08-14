package lr.se;

import org.junit.*;
import org.junit.runners.MethodSorters;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import java.util.concurrent.TimeUnit;


@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class Exmpl {

	public static WebDriver driver;

    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
    }

    @AfterClass
    public static void tearDownAfterClass() throws Exception {
        driver.quit();
    }

    @Test
    public void t001_OpenBrowserAndResize() throws Exception {
        driver.get("http://automationpractice.com/index.php"); 
        driver.manage().window().setSize(new Dimension(1040, 744));
    }

    @Test
    public void t002_ClickBlouse() throws Exception {
        ClickWrap("#homefeatured > .ajax_block_product:nth-child(2) .replace-2x");
    }

    @Test
    public void t003_ClickAddToCart() throws Exception {
        ClickWrap(".exclusive > span");
    }

    @Test
    public void t004_ClickProceedCheckout() throws Exception {
        ClickWrap(".button-medium > span");
    }

    @Test
    public void t005_ClickProceedStepTwo() throws Exception {
        ClickWrap(".standard-checkout > span");
    }

    @Test
    public void t006_VerifyAuthenticationText() throws Exception {
        String value = driver.findElement(By.cssSelector(".navigation_page")).getText();
        Assert.assertEquals(value, "Authentication");
    }

    public void ClickWrap(String css) throws Exception {
        Wait<WebDriver> wait = new FluentWait<WebDriver>(driver)
                .withTimeout(30, TimeUnit.SECONDS)
                .pollingEvery(1, TimeUnit.SECONDS)
                .ignoring(NoClassDefFoundError.class);
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(css))).click();
    }
}
