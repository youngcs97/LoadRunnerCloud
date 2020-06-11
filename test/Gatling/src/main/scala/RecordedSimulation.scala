import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class RecordedSimulation extends Simulation {

	val httpProtocol = http
		.baseUrl("http://www.advantageonlineshopping.com")
		.inferHtmlResources()
		.acceptHeader("image/webp,image/apng,image/*,*/*;q=0.8")
		.acceptEncodingHeader("gzip, deflate")
		.acceptLanguageHeader("en-US,en;q=0.9")
		.userAgentHeader("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36")

	val headers_0 = Map(
		"Accept" -> "application/json, text/plain, */*",
		"Proxy-Connection" -> "keep-alive")

	val headers_2 = Map(
		"Accept" -> "text/html",
		"Proxy-Connection" -> "keep-alive")

	val headers_4 = Map("Proxy-Connection" -> "keep-alive")

	val headers_9 = Map(
		"Accept" -> "application/xml, text/xml, */*; q=0.01",
		"Content-Type" -> "text/xml; charset=UTF-8",
		"Origin" -> "http://www.advantageonlineshopping.com",
		"Proxy-Connection" -> "keep-alive",
		"SOAPAction" -> "com.advantage.online.store.accountserviceGetCountriesRequest",
		"X-Requested-With" -> "XMLHttpRequest")



	val scn = scenario("RecordedSimulation")
		.exec(http("request_0")
			.get("/catalog/api/v1/products/19")
			.headers(headers_0)
			.resources(http("request_1")
			.get("/catalog/api/v1/categories/4/products")
			.headers(headers_0),
            http("request_2")
			.get("/app/views/product-page.html")
			.headers(headers_2),
            http("request_3")
			.get("/catalog/api/v1/categories/all_data")
			.headers(headers_0)
			.check(status.is(500)),
            http("request_4")
			.get("/catalog/fetchImage?image_id=4101")
			.headers(headers_4)))
		.pause(5)
		.exec(http("request_5")
			.get("/app/order/views/user-not-login-page.html")
			.headers(headers_2))
		.pause(2)
		.exec(http("request_6")
			.get("/app/user/views/register-page.html")
			.headers(headers_2)
			.resources(http("request_7")
			.get("/css/images/Bell.png")
			.headers(headers_4),
            http("request_8")
			.get("/css/images/Check.png")
			.headers(headers_4),
            http("request_9")
			.post("/accountservice/GetCountriesRequest")
			.headers(headers_9)
			.body(RawFileBody("/recordedsimulation/0009_request.dat"))))
		.pause(1)
		.exec(http("request_10")
			.get("/css/images/FacebookLogo.png")
			.headers(headers_4))
		.pause(3)
		.exec(http("request_11")
			.get("/app/views/shoppingCart.html")
			.headers(headers_2)
			.resources(http("request_12")
			.get("/css/images/Master_credit.png")
			.headers(headers_4),
            http("request_13")
			.get("/css/images/SafePay.png")
			.headers(headers_4)))

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}