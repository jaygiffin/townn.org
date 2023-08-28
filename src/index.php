<!doctype html>
<html>
	<head>
		<meta charset="utf-8"/>
		<title>The Organization With No Name</title>
		<link rel="stylesheet" href="style.css"/>
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic&display=swap" rel="stylesheet">
	</head>
	<body>
		<div class="side-menu">
			<div class="side-logo">
				<a href="/"><img src="images/text-TOWNN-filled.png" width="95%"/></a>
			</div>
			<a href="/" class="menu-item">
				<div class="link-chevron">›</div>home
			</a>
			<a href="/about-us/" class="menu-item">
				<div class="link-chevron">›</div>about us
			</a>
			<a href="/contact-us/" class="menu-item">
				<div class="link-chevron">›</div>contact us
			</a>
			<a href="" class="menu-item">
				<div class="link-chevron">›</div>donate
			</a>
		</div>
		<div class="page-content">
			<center>
				<img src="images/happy-face.png" class="title-image-happy"><img src="images/text/text-the-filled.png"/ class="title-image-the"><img src="images/sad-face.png" class="title-image-sad"><br />
				<img src="images/text/text-organization-filled.png" class="title-image-organization"/><br />
				<img src="images/text/text-with-hollow.png"/ class="title-image-with"><img src="images/text/text-no-hollow.png"/ class="title-image-no"><img src="images/text/text-name-hollow.png"/ class="title-image-name">
			</center>
		</div>
		<?php echo file_get_contents($_GET['page']); ?>
	</body>
</html>
