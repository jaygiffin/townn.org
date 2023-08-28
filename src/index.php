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
				<a href="/"><img src="images/text-townn-filled.png" width="95%"/></a>
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
			<?php echo file_get_contents($_GET['page']); ?>
		</div>
	</body>
</html>
