/* Shared speech for Space Words (Picture Planet and Sight Word Saucer) (plain ES5 for old Android WebViews).
   Uses recorded clips in audio/ when they exist, otherwise the device's text-to-speech. */
(function(){
"use strict";
var PHRASES = {"w_a":"a","w_and":"and","w_away":"away","w_big":"big","w_blue":"blue","w_can":"can","w_come":"come","s_come":"Can you come to my house?","w_down":"down","s_down":"The ball rolled down the hill.","w_find":"find","w_for":"for","w_funny":"funny","s_funny":"The clown is funny.","w_go":"go","w_help":"help","s_help":"Can you help me?","w_here":"here","w_i":"I","w_in":"in","w_is":"is","w_it":"it","w_jump":"jump","s_jump":"Frogs can jump high.","w_little":"little","s_little":"A little bug is on the leaf.","w_look":"look","w_make":"make","w_me":"me","w_my":"my","w_not":"not","w_one":"one","w_play":"play","s_play":"We like to play ball.","w_red":"red","w_run":"run","s_run":"The dog can run fast.","w_said":"said","s_said":"Mom said it is time for bed.","w_see":"see","s_see":"I can see a red ball.","w_the":"the","s_the":"I see the dog.","w_three":"three","w_to":"to","w_two":"two","s_two":"I have two hands.","w_up":"up","w_we":"we","w_where":"where","s_where":"Where is my hat?","w_yellow":"yellow","s_yellow":"The sun is big and yellow.","w_you":"you","w_all":"all","w_am":"am","w_are":"are","w_at":"at","w_ate":"ate","w_be":"be","w_black":"black","w_brown":"brown","w_but":"but","w_came":"came","w_did":"did","w_do":"do","w_eat":"eat","s_eat":"I like to eat apples.","w_four":"four","s_four":"A dog has four legs.","w_get":"get","w_good":"good","s_good":"This cake tastes good.","w_have":"have","w_he":"he","w_into":"into","w_like":"like","w_must":"must","w_new":"new","s_new":"I got new shoes.","w_no":"no","w_now":"now","w_on":"on","w_our":"our","w_out":"out","w_please":"please","s_please":"May I have a cookie, please?","w_pretty":"pretty","w_ran":"ran","w_ride":"ride","s_ride":"I can ride my bike.","w_saw":"saw","w_say":"say","w_she":"she","w_so":"so","w_soon":"soon","w_that":"that","w_there":"there","w_they":"they","s_they":"They are my friends.","w_this":"this","w_too":"too","w_under":"under","s_under":"The cat is under the bed.","w_want":"want","w_was":"was","s_was":"The cat was on the mat.","w_well":"well","w_went":"went","s_went":"We went to the park.","w_what":"what","s_what":"What is your name?","w_white":"white","w_who":"who","s_who":"Who is at the door?","w_will":"will","w_with":"with","s_with":"Come play with me.","w_yes":"yes","s_yes":"Can I go? yes, you can!","w_after":"after","w_again":"again","w_an":"an","w_any":"any","w_as":"as","w_ask":"ask","w_by":"by","w_could":"could","s_could":"I could not find my shoe.","w_every":"every","s_every":"I brush my teeth every day.","w_fly":"fly","s_fly":"Birds can fly.","w_from":"from","s_from":"This card is from Grandma.","w_give":"give","s_give":"Please give me the ball.","w_going":"going","w_had":"had","w_has":"has","w_her":"her","w_him":"him","w_his":"his","w_how":"how","s_how":"How old are you?","w_just":"just","w_know":"know","s_know":"I know how to swim.","w_let":"let","w_live":"live","w_may":"may","w_of":"of","w_old":"old","w_once":"once","s_once":"Once upon a time, there was a king.","w_open":"open","s_open":"Please open the door.","w_over":"over","w_put":"put","w_round":"round","w_some":"some","w_stop":"stop","s_stop":"Red means stop.","w_take":"take","w_thank":"thank","s_thank":"Thank you for the gift.","w_them":"them","w_then":"then","w_think":"think","w_walk":"walk","s_walk":"We walk the dog every day.","w_were":"were","s_were":"We were at the zoo.","w_when":"when","w_always":"always","s_always":"I always wash my hands before I eat.","w_around":"around","w_because":"because","s_because":"I wore a coat because it was cold.","w_been":"been","w_before":"before","w_best":"best","w_both":"both","w_buy":"buy","w_call":"call","w_cold":"cold","s_cold":"Ice is very cold.","w_does":"does","w_dont":"don't","s_dont":"Please don't touch the hot stove.","w_fast":"fast","w_first":"first","s_first":"I want to go first!","w_five":"five","w_found":"found","s_found":"I found my lost toy!","w_gave":"gave","w_goes":"goes","w_green":"green","s_green":"Grass is green.","w_its":"its","w_made":"made","w_many":"many","s_many":"How many cats do you have?","w_off":"off","w_or":"or","w_pull":"pull","w_read":"read","w_right":"right","w_sing":"sing","w_sit":"sit","w_sleep":"sleep","s_sleep":"I sleep in my bed.","w_tell":"tell","w_their":"their","s_their":"The kids put on their coats.","w_these":"these","w_those":"those","w_upon":"upon","w_us":"us","w_use":"use","w_very":"very","w_wash":"wash","w_which":"which","s_which":"Which one do you want?","w_why":"why","s_why":"Why is the sky blue?","w_wish":"wish","w_work":"work","w_would":"would","s_would":"Would you like some milk?","w_write":"write","s_write":"I can write my name.","w_your":"your","w_about":"about","w_better":"better","w_bring":"bring","w_carry":"carry","s_carry":"Can you help me carry this box?","w_clean":"clean","s_clean":"Please clean your room.","w_cut":"cut","w_done":"done","w_draw":"draw","w_drink":"drink","s_drink":"I drink milk at lunch.","w_eight":"eight","w_fall":"fall","w_far":"far","w_full":"full","w_got":"got","w_grow":"grow","s_grow":"Plants need water to grow.","w_hold":"hold","w_hot":"hot","w_hurt":"hurt","w_if":"if","w_keep":"keep","w_kind":"kind","w_laugh":"laugh","s_laugh":"Jokes make me laugh.","w_light":"light","s_light":"Turn on the light.","w_long":"long","w_much":"much","w_myself":"myself","s_myself":"I can tie my shoes by myself.","w_never":"never","s_never":"I will never give up.","w_only":"only","w_own":"own","w_pick":"pick","w_seven":"seven","w_shall":"shall","w_show":"show","w_six":"six","w_small":"small","w_start":"start","s_start":"The race will start soon.","w_ten":"ten","w_today":"today","s_today":"Today is my birthday!","w_together":"together","s_together":"We can play together.","w_try":"try","w_warm":"warm","s_warm":"The sun feels warm.","w_cat":"cat","w_dog":"dog","w_sun":"sun","w_bus":"bus","w_hat":"hat","w_pig":"pig","w_bed":"bed","w_bug":"bug","w_box":"box","w_fox":"fox","w_egg":"egg","w_map":"map","w_pen":"pen","w_web":"web","w_bat":"bat","w_van":"van","w_ant":"ant","w_frog":"frog","w_ship":"ship","w_fish":"fish","w_duck":"duck","w_crab":"crab","w_drum":"drum","w_star":"star","w_sock":"sock","w_chick":"chick","w_shell":"shell","w_truck":"truck","w_clock":"clock","w_flag":"flag","w_sled":"sled","w_ring":"ring","w_tent":"tent","w_milk":"milk","w_cake":"cake","w_kite":"kite","w_bike":"bike","w_rose":"rose","w_snail":"snail","w_train":"train","w_tree":"tree","w_bee":"bee","w_boat":"boat","w_goat":"goat","w_moon":"moon","w_snake":"snake","w_whale":"whale","w_cheese":"cheese","w_sheep":"sheep","w_house":"house","w_owl":"owl","w_bone":"bone","w_rain":"rain","w_rabbit":"rabbit","w_rocket":"rocket","w_pumpkin":"pumpkin","w_apple":"apple","w_tiger":"tiger","w_zebra":"zebra","w_pencil":"pencil","w_carrot":"carrot","w_robot":"robot","w_lemon":"lemon","w_monkey":"monkey","w_turtle":"turtle","w_candle":"candle","w_guitar":"guitar","w_balloon":"balloon","w_penguin":"penguin","w_dragon":"dragon","w_spider":"spider","w_cookie":"cookie","w_pizza":"pizza","w_butterfly":"butterfly","w_rainbow":"rainbow","w_snowman":"snowman","w_octopus":"octopus","w_elephant":"elephant","w_dinosaur":"dinosaur","w_umbrella":"umbrella","w_strawberry":"strawberry","w_pineapple":"pineapple","w_helicopter":"helicopter","w_telescope":"telescope","w_kangaroo":"kangaroo","w_crocodile":"crocodile","w_watermelon":"watermelon","w_sandwich":"sandwich","w_popcorn":"popcorn","w_sunflower":"sunflower","w_ladybug":"ladybug","w_cupcake":"cupcake","p_praise_0":"Great job!","p_praise_1":"You got it!","p_praise_2":"Super reading!","p_praise_3":"Awesome!","p_praise_4":"Yes!","p_praise_5":"Nice work!","p_space_0":"Beam it up!","p_space_1":"Out of this world!","p_space_2":"Great reading, space cadet!","p_space_3":"Blast off!","p_space_4":"You got it!","p_try":"Try again.","p_perfect":"Perfect! You read every word!","p_mission":"Mission complete!","p_spell":"Now spell it.","p_sound_on":"Talking is on.","p_hi":"Hi! Let's read some words.","p_stars_0":"You earned 0 stars!","p_stars_1":"You earned 1 star!","p_stars_2":"You earned 2 stars!","p_stars_3":"You earned 3 stars!","p_stars_4":"You earned 4 stars!","p_stars_5":"You earned 5 stars!","p_stars_6":"You earned 6 stars!","p_stars_7":"You earned 7 stars!","p_stars_8":"You earned 8 stars!","p_stars_9":"You earned 9 stars!","p_stars_10":"You earned 10 stars!","n_0":"zero","n_1":"one","n_2":"two","n_3":"three","n_4":"four","n_5":"five","n_6":"six","n_7":"seven","n_8":"eight","n_9":"nine","n_10":"ten","n_11":"eleven","n_12":"twelve","n_13":"thirteen","n_14":"fourteen","n_15":"fifteen","n_16":"sixteen","n_17":"seventeen","n_18":"eighteen","n_19":"nineteen","n_20":"twenty","n_21":"twenty-one","n_22":"twenty-two","n_23":"twenty-three","n_24":"twenty-four","n_25":"twenty-five","n_26":"twenty-six","n_27":"twenty-seven","n_28":"twenty-eight","n_29":"twenty-nine","n_30":"thirty","n_31":"thirty-one","n_32":"thirty-two","n_33":"thirty-three","n_34":"thirty-four","n_35":"thirty-five","n_36":"thirty-six","n_37":"thirty-seven","n_38":"thirty-eight","n_39":"thirty-nine","n_40":"forty","n_41":"forty-one","n_42":"forty-two","n_43":"forty-three","n_44":"forty-four","n_45":"forty-five","n_46":"forty-six","n_47":"forty-seven","n_48":"forty-eight","n_49":"forty-nine","n_50":"fifty","n_51":"fifty-one","n_52":"fifty-two","n_53":"fifty-three","n_54":"fifty-four","n_55":"fifty-five","n_56":"fifty-six","n_57":"fifty-seven","n_58":"fifty-eight","n_59":"fifty-nine","n_60":"sixty","n_61":"sixty-one","n_62":"sixty-two","n_63":"sixty-three","n_64":"sixty-four","n_65":"sixty-five","n_66":"sixty-six","n_67":"sixty-seven","n_68":"sixty-eight","n_69":"sixty-nine","n_70":"seventy","n_71":"seventy-one","n_72":"seventy-two","n_73":"seventy-three","n_74":"seventy-four","n_75":"seventy-five","n_76":"seventy-six","n_77":"seventy-seven","n_78":"seventy-eight","n_79":"seventy-nine","n_80":"eighty","n_81":"eighty-one","n_82":"eighty-two","n_83":"eighty-three","n_84":"eighty-four","n_85":"eighty-five","n_86":"eighty-six","n_87":"eighty-seven","n_88":"eighty-eight","n_89":"eighty-nine","n_90":"ninety","n_91":"ninety-one","n_92":"ninety-two","n_93":"ninety-three","n_94":"ninety-four","n_95":"ninety-five","n_96":"ninety-six","n_97":"ninety-seven","n_98":"ninety-eight","n_99":"ninety-nine","n_100":"one hundred","m_how_many":"How many?","m_find_group":"Tap the group with","m_more":"Which group has more?","m_fewer":"Which group has fewer?","m_bigger":"Which number is bigger?","m_smaller":"Which number is smaller?","m_after":"What comes after","m_before":"What comes before","m_between":"What number is between","m_and":"and","m_ten_more":"What is ten more than","m_ten_less":"What is ten less than","m_what_number":"What number is this?","m_what_is":"What is","m_plus":"plus","m_minus":"minus","m_times":"times","m_div":"divided by","m_groups_of":"groups of","m_in_all":"How many in all?","m_missing":"What number is missing?","m_next":"What comes next?","m_type":"Type the answer.","m_answer_is":"The answer is","m_praise_0":"Great math!","m_praise_1":"Math star!","m_praise_2":"Correct!","m_praise_3":"Super smart!","m_praise_4":"Nice thinking!","m_praise_5":"You're a math whiz!","i_pic":"Read the word. Tap its picture.","i_listen":"Listen, then tap the word you hear.","i_build":"Tap the letters to spell it.","i_beam":"Listen, then beam up the word you hear.","i_sentence":"Read the sentence. Which word fits?","i_look":"Look at the word, then spell it.","w_bear":"bear","w_belly":"belly","w_bite":"bite","w_bun":"bun","w_bunny":"bunny","w_cable":"cable","w_cap":"cap","w_chair":"chair","w_clap":"clap","w_coat":"coat","w_cone":"cone","w_cube":"cube","w_cuddle":"cuddle","w_cup":"cup","w_day":"day","w_dig":"dig","w_door":"door","w_fan":"fan","w_fed":"fed","w_flower":"flower","w_fun":"fun","w_game":"game","w_giggle":"giggle","w_hair":"hair","w_handle":"handle","w_head":"head","w_hen":"hen","w_hide":"hide","w_hit":"hit","w_honey":"honey","w_hop":"hop","w_hug":"hug","w_jelly":"jelly","w_jet":"jet","w_jog":"jog","w_key":"key","w_kitten":"kitten","w_lake":"lake","w_letter":"letter","w_lip":"lip","w_log":"log","w_man":"man","w_mat":"mat","w_meat":"meat","w_men":"men","w_mitten":"mitten","w_money":"money","w_mop":"mop","w_mug":"mug","w_name":"name","w_nap":"nap","w_net":"net","w_night":"night","w_nose":"nose","w_note":"note","w_parrot":"parrot","w_pear":"pear","w_pie":"pie","w_plane":"plane","w_plate":"plate","w_plum":"plum","w_pocket":"pocket","w_pop":"pop","w_pot":"pot","w_puddle":"puddle","w_pup":"pup","w_rug":"rug","w_seat":"seat","w_shoe":"shoe","w_snow":"snow","w_sweater":"sweater","w_table":"table","w_top":"top","w_tower":"tower","w_tube":"tube","w_wig":"wig","w_wiggle":"wiggle","w_zoo":"zoo","i_connect":"Tap a word, then tap its picture.","i_rhyme":"Tap a word, then tap the word that rhymes with it.","p_rhyme_0":"They rhyme!","p_rhyme_1":"Rhyme time!","p_rhyme_2":"You found a rhyme!","p_board":"Board complete!","m_equals":"equals","w_aliens":"aliens","w_apples":"apples","w_ball":"ball","w_balloons":"balloons","w_beam":"beam","w_between":"between","w_bigger":"bigger","w_birds":"birds","w_birthday":"birthday","w_brush":"brush","w_card":"card","w_cats":"cats","w_clown":"clown","w_coats":"coats","w_comes":"comes","w_cookies":"cookies","w_feels":"feels","w_fewer":"fewer","w_fits":"fits","w_flying":"flying","w_friends":"friends","w_frogs":"frogs","w_gift":"gift","w_grandma":"Grandma","w_grass":"grass","w_group":"group","w_groups":"groups","w_hands":"hands","w_hear":"hear","w_high":"high","w_hill":"hill","w_ice":"ice","w_jokes":"jokes","w_kids":"kids","w_king":"king","w_ladybugs":"ladybugs","w_leaf":"leaf","w_legs":"legs","w_less":"less","w_letters":"letters","w_listen":"listen","w_lost":"lost","w_lunch":"lunch","w_means":"means","w_missing":"missing","w_mom":"Mom","w_moons":"moons","w_more":"more","w_need":"need","w_next":"next","w_number":"number","w_park":"park","w_picture":"picture","w_planets":"planets","w_plants":"plants","w_race":"race","w_rhymes":"rhymes","w_rockets":"rockets","w_rolled":"rolled","w_room":"room","w_rule":"rule","w_satellites":"satellites","w_saucers":"saucers","w_sentence":"sentence","w_shoes":"shoes","w_shooting":"shooting","w_sky":"sky","w_smaller":"smaller","w_spell":"spell","w_stars":"stars","w_stove":"stove","w_swim":"swim","w_tap":"tap","w_tastes":"tastes","w_teeth":"teeth","w_than":"than","w_tie":"tie","w_time":"time","w_touch":"touch","w_toy":"toy","w_turn":"turn","w_water":"water","w_word":"word","w_wore":"wore","v_a_short":"Short A, like in cat.","v_a_long":"Long A, like in cake.","v_e_short":"Short E, like in bed.","v_e_long":"Long E, like in bee.","v_i_short":"Short I, like in pig.","v_i_long":"Long I, like in kite.","v_o_short":"Short O, like in dog.","v_o_long":"Long O, like in rose.","v_u_short":"Short U, like in bug.","v_u_long":"Long U, like in cube.","x_silent_e":"The E is silent. It makes the vowel say its name.","t_ai":"A and I together say the long A sound, like in rain.","t_ay":"A and Y together say the long A sound, like in day.","t_ee":"Two E's together say the long E sound, like in tree.","t_ea":"E and A together say the long E sound, like in eat.","t_oa":"O and A together say the long O sound, like in boat.","t_ow":"O and W together say the long O sound, like in snow.","t_igh":"I, G, H together say the long I sound, like in night.","t_ie":"I and E together say the long I sound, like in pie.","t_ue":"U and E together say the long U sound, like in blue.","r_ar":"A and R say are, like in car.","r_or":"O and R say or, like in fork.","r_er":"E R, I R, and U R all say err, like in her, bird, and turn.","i_swap":"Tap a vowel to make the word you hear.","i_vowel":"Which vowel sound do you hear?","i_which":"Which word do you hear?","i_shortlong":"Is the vowel sound short or long?","i_team":"Tap the letters that make the vowel sound.","i_syll":"How many syllables? Clap and count!","i_r":"Which bossy R sound do you hear?","sy_cat":"cat","sy_dog":"dog","sy_sun":"sun","sy_fish":"fish","sy_frog":"frog","sy_ship":"ship","sy_rab":"rab","sy_bit":"bit","sy_pump":"pump","sy_kin":"kin","sy_rock":"rock","sy_it":"it","sy_cup":"cup","sy_cake":"cake","sy_set":"set","sy_pick":"pick","sy_nick":"nick","sy_hot":"hot","sy_mag":"mag","sy_nit":"nit","sy_kit":"kit","sy_nap":"nap","sy_but":"but","sy_ter":"ter","sy_fly":"fly","sy_ell":"ell","sy_uh":"uh","sy_fent":"fent","sy_ock":"ock","sy_tuh":"tuh","sy_puss":"puss","sy_um":"um","sy_brell":"brell","sy_tell":"tell","sy_scope":"scope","sy_wah":"wah","sy_mel":"mel","sy_un":"un","sy_mack":"mack","sy_row":"row","sy_nee":"nee","sy_al":"al","sy_gay":"gay","sy_er":"er","sy_pill":"pill","w_alligator":"alligator","w_bad":"bad","w_bag":"bag","w_banana":"banana","w_beg":"beg","w_bid":"bid","w_bird":"bird","w_bit":"bit","w_bog":"bog","w_bossy":"bossy","w_bud":"bud","w_burn":"burn","w_cape":"cape","w_car":"car","w_caterpillar":"caterpillar","w_corn":"corn","w_cot":"cot","w_count":"count","w_cub":"cub","w_cute":"cute","w_dug":"dug","w_e":"E","w_each":"each","w_farm":"farm","w_fern":"fern","w_fin":"fin","w_fork":"fork","w_girl":"girl","w_glue":"glue","w_ham":"ham","w_hate":"hate","w_hope":"hope","w_horn":"horn","w_hotdog":"hot dog","w_hum":"hum","w_hut":"hut","w_jar":"jar","w_kit":"kit","w_lag":"lag","w_leg":"leg","w_macaroni":"macaroni","w_mad":"mad","w_magic":"magic","w_magnet":"magnet","w_makes":"makes","w_napkin":"napkin","w_nurse":"nurse","w_pail":"pail","w_pan":"pan","w_part":"part","w_pat":"pat","w_pet":"pet","w_picnic":"picnic","w_pin":"pin","w_pine":"pine","w_pit":"pit","w_r":"R","w_rag":"rag","w_rig":"rig","w_rod":"rod","w_rode":"rode","w_sat":"sat","w_seed":"seed","w_set":"set","w_shark":"shark","w_shirt":"shirt","w_short":"short","w_silent":"silent","w_sound":"sound","w_storm":"storm","w_sunset":"sunset","w_syllables":"syllables","w_tape":"tape","w_tip":"tip","w_tub":"tub","w_vowel":"vowel","i_cpic":"Pick the word that finishes the compound word.","i_cwhich":"Which one is a compound word?","i_cmatch":"Match the halves to make compound words.","i_csplit":"Tap between the letters to split it into two words.","i_cbuild":"Pick the word that makes a compound word. Start with","w_afternoon":"afternoon","w_air":"air","w_airplane":"airplane","w_anything":"anything","w_back":"back","w_backpack":"backpack","w_base":"base","w_baseball":"baseball","w_basket":"basket","w_basketball":"basketball","w_bath":"bath","w_bathroom":"bathroom","w_bathtub":"bathtub","w_bedroom":"bedroom","w_bell":"bell","w_berry":"berry","w_birdhouse":"birdhouse","w_birth":"birth","w_board":"board","w_body":"body","w_book":"book","w_bow":"bow","w_boy":"boy","w_bucket":"bucket","w_butter":"butter","w_button":"button","w_camp":"camp","w_campfire":"campfire","w_class":"class","w_classmate":"classmate","w_classroom":"classroom","w_cow":"cow","w_cowboy":"cowboy","w_cupboard":"cupboard","w_cycle":"cycle","w_doctor":"doctor","w_doghouse":"doghouse","w_doorbell":"doorbell","w_drop":"drop","w_drumstick":"drumstick","w_ear":"ear","w_earring":"earring","w_end":"end","w_everything":"everything","w_eye":"eye","w_eyeball":"eyeball","w_farmhouse":"farmhouse","w_father":"father","w_fighter":"fighter","w_finger":"finger","w_fingernail":"fingernail","w_fire":"fire","w_firefighter":"firefighter","w_firefly":"firefly","w_firetruck":"firetruck","w_fireworks":"fireworks","w_flake":"flake","w_foot":"foot","w_football":"football","w_garden":"garden","w_giant":"giant","w_glasses":"glasses","w_gold":"gold","w_goldfish":"goldfish","w_grand":"grand","w_grandfather":"grandfather","w_grandmother":"grandmother","w_grasshopper":"grasshopper","w_ground":"ground","w_haircut":"haircut","w_hand":"hand","w_handbag":"handbag","w_happy":"happy","w_headlight":"headlight","w_helmet":"helmet","w_home":"home","w_homework":"homework","w_hopper":"hopper","w_horse":"horse","w_horseshoe":"horseshoe","w_jacket":"jacket","w_jellyfish":"jellyfish","w_keyboard":"keyboard","w_lady":"lady","w_lunchbox":"lunchbox","w_mail":"mail","w_mailbox":"mailbox","w_mate":"mate","w_melon":"melon","w_moonlight":"moonlight","w_mother":"mother","w_motor":"motor","w_motorcycle":"motorcycle","w_nail":"nail","w_news":"news","w_newspaper":"newspaper","w_nightlight":"nightlight","w_noon":"noon","w_notebook":"notebook","w_pack":"pack","w_paint":"paint","w_paintbrush":"paintbrush","w_pancake":"pancake","w_paper":"paper","w_paste":"paste","w_playground":"playground","w_police":"police","w_policeman":"policeman","w_purple":"purple","w_raincoat":"raincoat","w_raindrop":"raindrop","w_sail":"sail","w_sailboat":"sailboat","w_sand":"sand","w_sandbox":"sandbox","w_sea":"sea","w_seashell":"seashell","w_shine":"shine","w_sister":"sister","w_skate":"skate","w_skateboard":"skateboard","w_snowball":"snowball","w_snowflake":"snowflake","w_somebody":"somebody","w_starfish":"starfish","w_starlight":"starlight","w_stick":"stick","w_straw":"straw","w_summer":"summer","w_sunglasses":"sunglasses","w_sunshine":"sunshine","w_tea":"tea","w_teapot":"teapot","w_thing":"thing","w_thunder":"thunder","w_thunderstorm":"thunderstorm","w_tooth":"tooth","w_toothbrush":"toothbrush","w_toothpaste":"toothpaste","w_week":"week","w_weekend":"weekend","w_window":"window","w_winter":"winter","w_works":"works","w_finishes":"finishes","w_compound":"compound","w_match":"match","w_halves":"halves","w_words":"words","w_split":"split","sy_tin":"tin","sy_bah":"bah","sy_nah":"nah","sy_nuh":"nuh","sy_luh":"luh","sy_lih":"lih","sy_ler":"ler","cs_i":"I can jump.","cs_a":"I see a red ball.","cs_the":"Look at the moon.","cs_to":"We go to the park.","cs_play":"We like to play.","cs_see":"I see a star.","cs_for":"This is for you.","cs_like":"I like my cat.","cs_have":"I have a dog.","cs_you":"I love you.","cs_who":"Who is at the door?","cs_what":"What is that?","cs_where":"Where is my hat?","cs_go":"We go up in a rocket.","cs_so":"I am so happy.","cs_look":"Look at me!","cs_want":"I want to play.","cs_come":"Come with me.","cs_said":"Mom said yes.","cs_saw":"I saw a frog.","cs_be":"I will be good.","cs_she":"She can run fast.","cs_he":"He is my friend.","cs_we":"We can help.","cs_me":"Play with me.","cs_black":"The cat is black.","cs_blue":"The sky is blue.","cs_brown":"The dog is brown.","cs_yellow":"The sun is yellow.","cs_are":"We are friends.","cs_little":"I see a little bug.","cs_with":"Come play with me.","cs_find":"Can you find my shoe?","cs_no":"No, thank you.","cs_they":"They like to jump.","cs_help":"Can you help me?","cs_jump":"I can jump high.","cs_was":"It was fun.","cs_will":"I will go to bed.","cs_went":"We went to the zoo.","cs_that":"I want that one.","cs_this":"This is my book.","cs_there":"There is a moon.","cs_do":"What do you see?","cs_my":"This is my mom.","cs_too":"I want to come too.","cs_am":"I am five.","cs_down":"Sit down, please.","cs_must":"We must go now.","cs_can":"I can read!","cs_at":"Look at the stars.","cs_now":"Come here now.","cs_well":"She can sing well.","cs_new":"I have a new hat.","cs_not":"I am not sad.","cs_all":"We all like cake.","cs_good":"That was good.","cs_sat":"The cat sat down.","cs_our":"This is our house.","cs_out":"The dog went out.","cs_eat":"We eat lunch.","cs_soon":"We will go soon.","cs_please":"Please help me.","cs_ride":"I can ride a bike.","cs_white":"The snow is white.","cs_pretty":"The flower is pretty.","cs_funny":"The clown is funny.","cs_away":"The bird flew away.","cs_came":"My friend came over.","i_cw_find":"Find the word you hear.","i_cw_teach":"Zib the alien is learning to read. Is Zib right?","z_think":"I think this word says","z_yay":"Yay! I got it right!","z_thanks":"Oops! Thank you for teaching me!","p_it_says":"It says","p_listen_zib":"Listen to Zib again.","i_cw_hunt":"Word hunt! Tap every word that says","p_that_says":"That word says","i_cw_write":"Trace the word with your finger. Use lots of colors!","p_rainbow":"Beautiful rainbow writing!","i_cw_roll":"Roll the die! Read the word that many times. Try silly voices!","p_times":"times!","i_cw_say":"Say the word. Then use it in a sentence!","p_good_sentence":"Great sentence!","w_love":"love","w_friend":"friend","w_sad":"sad","w_flew":"flew","w_zib":"Zib","w_alien":"alien","w_learning":"learning","w_hunt":"hunt","w_trace":"trace","w_lots":"lots","w_colors":"colors","w_roll":"roll","w_die":"die","w_times":"times","w_silly":"silly","w_voices":"voices","m_rule":"The rule is","m_then":"then","m_rule_grow":"Each jump is one bigger!","m_rule_square":"These are square numbers. Each one is a number times itself!","m_rule_repeat":"The pattern repeats!","ws_a":"a","ws_and":"and","ws_away":"away","ws_big":"big","ws_blue":"blue","ws_can":"can","ws_come":"come","ws_down":"down","ws_find":"find","ws_for":"for","ws_funny":"funny","ws_go":"go","ws_help":"help","ws_here":"here","ws_i":"I","ws_in":"in","ws_is":"is","ws_it":"it","ws_jump":"jump","ws_little":"little","ws_look":"look","ws_make":"make","ws_me":"me","ws_my":"my","ws_not":"not","ws_one":"one","ws_play":"play","ws_red":"red","ws_run":"run","ws_said":"said","ws_see":"see","ws_the":"the","ws_three":"three","ws_to":"to","ws_two":"two","ws_up":"up","ws_we":"we","ws_where":"where","ws_yellow":"yellow","ws_you":"you","ws_all":"all","ws_am":"am","ws_are":"are","ws_at":"at","ws_ate":"ate","ws_be":"be","ws_black":"black","ws_brown":"brown","ws_but":"but","ws_came":"came","ws_did":"did","ws_do":"do","ws_eat":"eat","ws_four":"four","ws_get":"get","ws_good":"good","ws_have":"have","ws_he":"he","ws_into":"into","ws_like":"like","ws_must":"must","ws_new":"new","ws_no":"no","ws_now":"now","ws_on":"on","ws_our":"our","ws_out":"out","ws_please":"please","ws_pretty":"pretty","ws_ran":"ran","ws_ride":"ride","ws_saw":"saw","ws_say":"say","ws_she":"she","ws_so":"so","ws_soon":"soon","ws_that":"that","ws_there":"there","ws_they":"they","ws_this":"this","ws_too":"too","ws_under":"under","ws_want":"want","ws_was":"was","ws_well":"well","ws_went":"went","ws_what":"what","ws_white":"white","ws_who":"who","ws_will":"will","ws_with":"with","ws_yes":"yes","ws_after":"after","ws_again":"again","ws_an":"an","ws_any":"any","ws_as":"as","ws_ask":"ask","ws_by":"by","ws_could":"could","ws_every":"every","ws_fly":"fly","ws_from":"from","ws_give":"give","ws_going":"going","ws_had":"had","ws_has":"has","ws_her":"her","ws_him":"him","ws_his":"his","ws_how":"how","ws_just":"just","ws_know":"know","ws_let":"let","ws_live":"live","ws_may":"may","ws_of":"of","ws_old":"old","ws_once":"once","ws_open":"open","ws_over":"over","ws_put":"put","ws_round":"round","ws_some":"some","ws_stop":"stop","ws_take":"take","ws_thank":"thank","ws_them":"them","ws_then":"then","ws_think":"think","ws_walk":"walk","ws_were":"were","ws_when":"when","ws_always":"always","ws_around":"around","ws_because":"because","ws_been":"been","ws_before":"before","ws_best":"best","ws_both":"both","ws_buy":"buy","ws_call":"call","ws_cold":"cold","ws_does":"does","ws_dont":"don't","ws_fast":"fast","ws_first":"first","ws_five":"five","ws_found":"found","ws_gave":"gave","ws_goes":"goes","ws_green":"green","ws_its":"its","ws_made":"made","ws_many":"many","ws_off":"off","ws_or":"or","ws_pull":"pull","ws_read":"read","ws_right":"right","ws_sing":"sing","ws_sit":"sit","ws_sleep":"sleep","ws_tell":"tell","ws_their":"their","ws_these":"these","ws_those":"those","ws_upon":"upon","ws_us":"us","ws_use":"use","ws_very":"very","ws_wash":"wash","ws_which":"which","ws_why":"why","ws_wish":"wish","ws_work":"work","ws_would":"would","ws_write":"write","ws_your":"your","ws_about":"about","ws_better":"better","ws_bring":"bring","ws_carry":"carry","ws_clean":"clean","ws_cut":"cut","ws_done":"done","ws_draw":"draw","ws_drink":"drink","ws_eight":"eight","ws_fall":"fall","ws_far":"far","ws_full":"full","ws_got":"got","ws_grow":"grow","ws_hold":"hold","ws_hot":"hot","ws_hurt":"hurt","ws_if":"if","ws_keep":"keep","ws_kind":"kind","ws_laugh":"laugh","ws_light":"light","ws_long":"long","ws_much":"much","ws_myself":"myself","ws_never":"never","ws_only":"only","ws_own":"own","ws_pick":"pick","ws_seven":"seven","ws_shall":"shall","ws_show":"show","ws_six":"six","ws_small":"small","ws_start":"start","ws_ten":"ten","ws_today":"today","ws_together":"together","ws_try":"try","ws_warm":"warm","ws_cat":"cat","ws_dog":"dog","ws_sun":"sun","ws_bus":"bus","ws_hat":"hat","ws_pig":"pig","ws_bed":"bed","ws_bug":"bug","ws_box":"box","ws_fox":"fox","ws_egg":"egg","ws_map":"map","ws_pen":"pen","ws_web":"web","ws_bat":"bat","ws_van":"van","ws_ant":"ant","ws_frog":"frog","ws_ship":"ship","ws_fish":"fish","ws_duck":"duck","ws_crab":"crab","ws_drum":"drum","ws_star":"star","ws_sock":"sock","ws_chick":"chick","ws_shell":"shell","ws_truck":"truck","ws_clock":"clock","ws_flag":"flag","ws_sled":"sled","ws_ring":"ring","ws_tent":"tent","ws_milk":"milk","ws_cake":"cake","ws_kite":"kite","ws_bike":"bike","ws_rose":"rose","ws_snail":"snail","ws_train":"train","ws_tree":"tree","ws_bee":"bee","ws_boat":"boat","ws_goat":"goat","ws_moon":"moon","ws_snake":"snake","ws_whale":"whale","ws_cheese":"cheese","ws_sheep":"sheep","ws_house":"house","ws_owl":"owl","ws_bone":"bone","ws_rain":"rain","ws_rabbit":"rabbit","ws_rocket":"rocket","ws_pumpkin":"pumpkin","ws_apple":"apple","ws_tiger":"tiger","ws_zebra":"zebra","ws_pencil":"pencil","ws_carrot":"carrot","ws_robot":"robot","ws_lemon":"lemon","ws_monkey":"monkey","ws_turtle":"turtle","ws_candle":"candle","ws_guitar":"guitar","ws_balloon":"balloon","ws_penguin":"penguin","ws_dragon":"dragon","ws_spider":"spider","ws_cookie":"cookie","ws_pizza":"pizza","ws_butterfly":"butterfly","ws_rainbow":"rainbow","ws_snowman":"snowman","ws_octopus":"octopus","ws_elephant":"elephant","ws_dinosaur":"dinosaur","ws_umbrella":"umbrella","ws_strawberry":"strawberry","ws_pineapple":"pineapple","ws_helicopter":"helicopter","ws_telescope":"telescope","ws_kangaroo":"kangaroo","ws_crocodile":"crocodile","ws_watermelon":"watermelon","ws_sandwich":"sandwich","ws_popcorn":"popcorn","ws_sunflower":"sunflower","ws_ladybug":"ladybug","ws_cupcake":"cupcake","ws_bear":"bear","ws_belly":"belly","ws_bite":"bite","ws_bun":"bun","ws_bunny":"bunny","ws_cable":"cable","ws_cap":"cap","ws_chair":"chair","ws_clap":"clap","ws_coat":"coat","ws_cone":"cone","ws_cube":"cube","ws_cuddle":"cuddle","ws_cup":"cup","ws_day":"day","ws_dig":"dig","ws_door":"door","ws_fan":"fan","ws_fed":"fed","ws_flower":"flower","ws_fun":"fun","ws_game":"game","ws_giggle":"giggle","ws_hair":"hair","ws_handle":"handle","ws_head":"head","ws_hen":"hen","ws_hide":"hide","ws_hit":"hit","ws_honey":"honey","ws_hop":"hop","ws_hug":"hug","ws_jelly":"jelly","ws_jet":"jet","ws_jog":"jog","ws_key":"key","ws_kitten":"kitten","ws_lake":"lake","ws_letter":"letter","ws_lip":"lip","ws_log":"log","ws_man":"man","ws_mat":"mat","ws_meat":"meat","ws_men":"men","ws_mitten":"mitten","ws_money":"money","ws_mop":"mop","ws_mug":"mug","ws_name":"name","ws_nap":"nap","ws_net":"net","ws_night":"night","ws_nose":"nose","ws_note":"note","ws_parrot":"parrot","ws_pear":"pear","ws_pie":"pie","ws_plane":"plane","ws_plate":"plate","ws_plum":"plum","ws_pocket":"pocket","ws_pop":"pop","ws_pot":"pot","ws_puddle":"puddle","ws_pup":"pup","ws_rug":"rug","ws_seat":"seat","ws_shoe":"shoe","ws_snow":"snow","ws_sweater":"sweater","ws_table":"table","ws_top":"top","ws_tower":"tower","ws_tube":"tube","ws_wig":"wig","ws_wiggle":"wiggle","ws_zoo":"zoo","ws_aliens":"aliens","ws_apples":"apples","ws_ball":"ball","ws_balloons":"balloons","ws_beam":"beam","ws_between":"between","ws_bigger":"bigger","ws_birds":"birds","ws_birthday":"birthday","ws_brush":"brush","ws_card":"card","ws_cats":"cats","ws_clown":"clown","ws_coats":"coats","ws_comes":"comes","ws_cookies":"cookies","ws_feels":"feels","ws_fewer":"fewer","ws_fits":"fits","ws_flying":"flying","ws_friends":"friends","ws_frogs":"frogs","ws_gift":"gift","ws_grandma":"Grandma","ws_grass":"grass","ws_group":"group","ws_groups":"groups","ws_hands":"hands","ws_hear":"hear","ws_high":"high","ws_hill":"hill","ws_ice":"ice","ws_jokes":"jokes","ws_kids":"kids","ws_king":"king","ws_ladybugs":"ladybugs","ws_leaf":"leaf","ws_legs":"legs","ws_less":"less","ws_letters":"letters","ws_listen":"listen","ws_lost":"lost","ws_lunch":"lunch","ws_means":"means","ws_missing":"missing","ws_mom":"Mom","ws_moons":"moons","ws_more":"more","ws_need":"need","ws_next":"next","ws_number":"number","ws_park":"park","ws_picture":"picture","ws_planets":"planets","ws_plants":"plants","ws_race":"race","ws_rhymes":"rhymes","ws_rockets":"rockets","ws_rolled":"rolled","ws_room":"room","ws_rule":"rule","ws_satellites":"satellites","ws_saucers":"saucers","ws_sentence":"sentence","ws_shoes":"shoes","ws_shooting":"shooting","ws_sky":"sky","ws_smaller":"smaller","ws_spell":"spell","ws_stars":"stars","ws_stove":"stove","ws_swim":"swim","ws_tap":"tap","ws_tastes":"tastes","ws_teeth":"teeth","ws_than":"than","ws_tie":"tie","ws_time":"time","ws_touch":"touch","ws_toy":"toy","ws_turn":"turn","ws_water":"water","ws_word":"word","ws_wore":"wore","ws_alligator":"alligator","ws_bad":"bad","ws_bag":"bag","ws_banana":"banana","ws_beg":"beg","ws_bid":"bid","ws_bird":"bird","ws_bit":"bit","ws_bog":"bog","ws_bossy":"bossy","ws_bud":"bud","ws_burn":"burn","ws_cape":"cape","ws_car":"car","ws_caterpillar":"caterpillar","ws_corn":"corn","ws_cot":"cot","ws_count":"count","ws_cub":"cub","ws_cute":"cute","ws_dug":"dug","ws_e":"E","ws_each":"each","ws_farm":"farm","ws_fern":"fern","ws_fin":"fin","ws_fork":"fork","ws_girl":"girl","ws_glue":"glue","ws_ham":"ham","ws_hate":"hate","ws_hope":"hope","ws_horn":"horn","ws_hotdog":"hot dog","ws_hum":"hum","ws_hut":"hut","ws_jar":"jar","ws_kit":"kit","ws_lag":"lag","ws_leg":"leg","ws_macaroni":"macaroni","ws_mad":"mad","ws_magic":"magic","ws_magnet":"magnet","ws_makes":"makes","ws_napkin":"napkin","ws_nurse":"nurse","ws_pail":"pail","ws_pan":"pan","ws_part":"part","ws_pat":"pat","ws_pet":"pet","ws_picnic":"picnic","ws_pin":"pin","ws_pine":"pine","ws_pit":"pit","ws_r":"R","ws_rag":"rag","ws_rig":"rig","ws_rod":"rod","ws_rode":"rode","ws_sat":"sat","ws_seed":"seed","ws_set":"set","ws_shark":"shark","ws_shirt":"shirt","ws_short":"short","ws_silent":"silent","ws_sound":"sound","ws_storm":"storm","ws_sunset":"sunset","ws_syllables":"syllables","ws_tape":"tape","ws_tip":"tip","ws_tub":"tub","ws_vowel":"vowel","ws_afternoon":"afternoon","ws_air":"air","ws_airplane":"airplane","ws_anything":"anything","ws_back":"back","ws_backpack":"backpack","ws_base":"base","ws_baseball":"baseball","ws_basket":"basket","ws_basketball":"basketball","ws_bath":"bath","ws_bathroom":"bathroom","ws_bathtub":"bathtub","ws_bedroom":"bedroom","ws_bell":"bell","ws_berry":"berry","ws_birdhouse":"birdhouse","ws_birth":"birth","ws_board":"board","ws_body":"body","ws_book":"book","ws_bow":"bow","ws_boy":"boy","ws_bucket":"bucket","ws_butter":"butter","ws_button":"button","ws_camp":"camp","ws_campfire":"campfire","ws_class":"class","ws_classmate":"classmate","ws_classroom":"classroom","ws_cow":"cow","ws_cowboy":"cowboy","ws_cupboard":"cupboard","ws_cycle":"cycle","ws_doctor":"doctor","ws_doghouse":"doghouse","ws_doorbell":"doorbell","ws_drop":"drop","ws_drumstick":"drumstick","ws_ear":"ear","ws_earring":"earring","ws_end":"end","ws_everything":"everything","ws_eye":"eye","ws_eyeball":"eyeball","ws_farmhouse":"farmhouse","ws_father":"father","ws_fighter":"fighter","ws_finger":"finger","ws_fingernail":"fingernail","ws_fire":"fire","ws_firefighter":"firefighter","ws_firefly":"firefly","ws_firetruck":"firetruck","ws_fireworks":"fireworks","ws_flake":"flake","ws_foot":"foot","ws_football":"football","ws_garden":"garden","ws_giant":"giant","ws_glasses":"glasses","ws_gold":"gold","ws_goldfish":"goldfish","ws_grand":"grand","ws_grandfather":"grandfather","ws_grandmother":"grandmother","ws_grasshopper":"grasshopper","ws_ground":"ground","ws_haircut":"haircut","ws_hand":"hand","ws_handbag":"handbag","ws_happy":"happy","ws_headlight":"headlight","ws_helmet":"helmet","ws_home":"home","ws_homework":"homework","ws_hopper":"hopper","ws_horse":"horse","ws_horseshoe":"horseshoe","ws_jacket":"jacket","ws_jellyfish":"jellyfish","ws_keyboard":"keyboard","ws_lady":"lady","ws_lunchbox":"lunchbox","ws_mail":"mail","ws_mailbox":"mailbox","ws_mate":"mate","ws_melon":"melon","ws_moonlight":"moonlight","ws_mother":"mother","ws_motor":"motor","ws_motorcycle":"motorcycle","ws_nail":"nail","ws_news":"news","ws_newspaper":"newspaper","ws_nightlight":"nightlight","ws_noon":"noon","ws_notebook":"notebook","ws_pack":"pack","ws_paint":"paint","ws_paintbrush":"paintbrush","ws_pancake":"pancake","ws_paper":"paper","ws_paste":"paste","ws_playground":"playground","ws_police":"police","ws_policeman":"policeman","ws_purple":"purple","ws_raincoat":"raincoat","ws_raindrop":"raindrop","ws_sail":"sail","ws_sailboat":"sailboat","ws_sand":"sand","ws_sandbox":"sandbox","ws_sea":"sea","ws_seashell":"seashell","ws_shine":"shine","ws_sister":"sister","ws_skate":"skate","ws_skateboard":"skateboard","ws_snowball":"snowball","ws_snowflake":"snowflake","ws_somebody":"somebody","ws_starfish":"starfish","ws_starlight":"starlight","ws_stick":"stick","ws_straw":"straw","ws_summer":"summer","ws_sunglasses":"sunglasses","ws_sunshine":"sunshine","ws_tea":"tea","ws_teapot":"teapot","ws_thing":"thing","ws_thunder":"thunder","ws_thunderstorm":"thunderstorm","ws_tooth":"tooth","ws_toothbrush":"toothbrush","ws_toothpaste":"toothpaste","ws_week":"week","ws_weekend":"weekend","ws_window":"window","ws_winter":"winter","ws_works":"works","ws_finishes":"finishes","ws_compound":"compound","ws_match":"match","ws_halves":"halves","ws_words":"words","ws_split":"split","ws_love":"love","ws_friend":"friend","ws_sad":"sad","ws_flew":"flew","ws_zib":"Zib","ws_alien":"alien","ws_learning":"learning","ws_hunt":"hunt","ws_trace":"trace","ws_lots":"lots","ws_colors":"colors","ws_roll":"roll","ws_die":"die","ws_times":"times","ws_silly":"silly","ws_voices":"voices","p_switch_turns":"Time's up! Switch turns!","p_your_turn":"Your turn!","p_minutes":"minutes.","p_minute":"minute.","p_have_fun":"Have fun!","m_add_ones":"Add the ones.","m_add_tens":"Now add the tens. Remember the one you carried!","m_write":"Write","m_carry":"and carry the one to the tens.","w_add":"add","ws_add":"add","w_ones":"ones","ws_ones":"ones","w_tens":"tens","ws_tens":"tens","w_nut":"nut","ws_nut":"nut","w_peg":"peg","ws_peg":"peg","w_pug":"pug","ws_pug":"pug","w_hog":"hog","ws_hog":"hog","w_jug":"jug","ws_jug":"jug","w_mud":"mud","ws_mud":"mud","w_tan":"tan","ws_tan":"tan","w_tin":"tin","ws_tin":"tin","w_peck":"peck","ws_peck":"peck","w_puck":"puck","ws_puck":"puck","w_lick":"lick","ws_lick":"lick","w_lock":"lock","ws_lock":"lock","w_luck":"luck","ws_luck":"luck","w_rack":"rack","ws_rack":"rack","w_rock":"rock","ws_rock":"rock","w_tick":"tick","ws_tick":"tick","w_tuck":"tuck","ws_tuck":"tuck","w_shop":"shop","ws_shop":"shop","w_chip":"chip","ws_chip":"chip","w_chop":"chop","ws_chop":"chop","w_cop":"cop","ws_cop":"cop","w_cab":"cab","ws_cab":"cab","w_tab":"tab","ws_tab":"tab","w_rib":"rib","ws_rib":"rib","w_rub":"rub","ws_rub":"rub","w_lap":"lap","ws_lap":"lap","w_hip":"hip","ws_hip":"hip","w_rat":"rat","ws_rat":"rat","w_rot":"rot","ws_rot":"rot","w_gem":"gem","ws_gem":"gem","w_gum":"gum","ws_gum":"gum","w_hid":"hid","ws_hid":"hid","w_led":"led","ws_led":"led","w_lid":"lid","ws_lid":"lid","w_rid":"rid","ws_rid":"rid","w_bin":"bin","ws_bin":"bin","w_nip":"nip","ws_nip":"nip","w_tag":"tag","ws_tag":"tag","w_tug":"tug","ws_tug":"tug","w_dash":"dash","ws_dash":"dash","w_dish":"dish","ws_dish":"dish","w_rash":"rash","ws_rash":"rash","w_rush":"rush","ws_rush":"rush","w_mess":"mess","ws_mess":"mess","w_miss":"miss","ws_miss":"miss","w_moss":"moss","ws_moss":"moss","w_loss":"loss","ws_loss":"loss","w_band":"band","ws_band":"band","w_bend":"bend","ws_bend":"bend","w_send":"send","ws_send":"send","w_lamp":"lamp","ws_lamp":"lamp","w_limp":"limp","ws_limp":"limp","w_lump":"lump","ws_lump":"lump","w_step":"step","ws_step":"step","w_drip":"drip","ws_drip":"drip","w_trap":"trap","ws_trap":"trap","w_trip":"trip","ws_trip":"trip","w_flap":"flap","ws_flap":"flap","w_flip":"flip","ws_flip":"flip","w_flop":"flop","ws_flop":"flop","w_clip":"clip","ws_clip":"clip","w_snap":"snap","ws_snap":"snap","w_snip":"snip","ws_snip":"snip","w_crib":"crib","ws_crib":"crib","w_slid":"slid","ws_slid":"slid","w_spin":"spin","ws_spin":"spin","w_spun":"spun","ws_spun":"spun","w_stack":"stack","ws_stack":"stack","w_stuck":"stuck","ws_stuck":"stuck","w_block":"block","ws_block":"block","w_click":"click","ws_click":"click","w_track":"track","ws_track":"track","w_trick":"trick","ws_trick":"trick","w_check":"check","ws_check":"check","w_grab":"grab","ws_grab":"grab","w_grub":"grub","ws_grub":"grub","w_zap":"zap","ws_zap":"zap","w_zip":"zip","ws_zip":"zip","w_yam":"yam","ws_yam":"yam","w_yum":"yum","ws_yum":"yum","w_swam":"swam","ws_swam":"swam","w_thin":"thin","ws_thin":"thin","w_desk":"desk","ws_desk":"desk","w_disk":"disk","ws_disk":"disk","w_dusk":"dusk","ws_dusk":"dusk","w_task":"task","ws_task":"task","w_tusk":"tusk","ws_tusk":"tusk","w_mist":"mist","ws_mist":"mist","w_rest":"rest","ws_rest":"rest","w_rust":"rust","ws_rust":"rust","w_jam":"jam","ws_jam":"jam","w_ram":"ram","ws_ram":"ram","w_dad":"dad","ws_dad":"dad","w_wax":"wax","ws_wax":"wax","w_yak":"yak","ws_yak":"yak","w_vet":"vet","ws_vet":"vet","w_wet":"wet","ws_wet":"wet","w_bib":"bib","ws_bib":"bib","w_fix":"fix","ws_fix":"fix","w_mix":"mix","ws_mix":"mix","w_win":"win","ws_win":"win","w_dot":"dot","ws_dot":"dot","w_cane":"cane","ws_cane":"cane","w_mane":"mane","ws_mane":"mane","w_pane":"pane","ws_pane":"pane","w_plan":"plan","ws_plan":"plan","w_rate":"rate","ws_rate":"rate","w_pal":"pal","ws_pal":"pal","w_pale":"pale","ws_pale":"pale","w_past":"past","ws_past":"past","w_scrap":"scrap","ws_scrap":"scrap","w_scrape":"scrape","ws_scrape":"scrape","w_fad":"fad","ws_fad":"fad","w_fade":"fade","ws_fade":"fade","w_stag":"stag","ws_stag":"stag","w_stage":"stage","ws_stage":"stage","w_vane":"vane","ws_vane":"vane","w_dim":"dim","ws_dim":"dim","w_dime":"dime","ws_dime":"dime","w_fine":"fine","ws_fine":"fine","w_slide":"slide","ws_slide":"slide","w_rip":"rip","ws_rip":"rip","w_ripe":"ripe","ws_ripe":"ripe","w_spine":"spine","ws_spine":"spine","w_shin":"shin","ws_shin":"shin","w_slim":"slim","ws_slim":"slim","w_slime":"slime","ws_slime":"slime","w_strip":"strip","ws_strip":"strip","w_stripe":"stripe","ws_stripe":"stripe","w_quit":"quit","ws_quit":"quit","w_quite":"quite","ws_quite":"quite","w_twin":"twin","ws_twin":"twin","w_twine":"twine","ws_twine":"twine","w_cod":"cod","ws_cod":"cod","w_code":"code","ws_code":"code","w_glob":"glob","ws_glob":"glob","w_globe":"globe","ws_globe":"globe","w_slop":"slop","ws_slop":"slop","w_slope":"slope","ws_slope":"slope","w_mope":"mope","ws_mope":"mope","w_huge":"huge","ws_huge":"huge","w_plume":"plume","ws_plume":"plume","w_theme":"theme","ws_theme":"theme","w_tail":"tail","ws_tail":"tail","w_wait":"wait","ws_wait":"wait","w_brain":"brain","ws_brain":"brain","w_chain":"chain","ws_chain":"chain","w_way":"way","ws_way":"way","w_hay":"hay","ws_hay":"hay","w_tray":"tray","ws_tray":"tray","w_gray":"gray","ws_gray":"gray","w_stay":"stay","ws_stay":"stay","w_clay":"clay","ws_clay":"clay","w_spray":"spray","ws_spray":"spray","w_feet":"feet","ws_feet":"feet","w_beep":"beep","ws_beep":"beep","w_jeep":"jeep","ws_jeep":"jeep","w_queen":"queen","ws_queen":"queen","w_feed":"feed","ws_feed":"feed","w_pea":"pea","ws_pea":"pea","w_beach":"beach","ws_beach":"beach","w_peach":"peach","ws_peach":"peach","w_leap":"leap","ws_leap":"leap","w_seal":"seal","ws_seal":"seal","w_bean":"bean","ws_bean":"bean","w_heat":"heat","ws_heat":"heat","w_dream":"dream","ws_dream":"dream","w_team":"team","ws_team":"team","w_beak":"beak","ws_beak":"beak","w_teach":"teach","ws_teach":"teach","w_road":"road","ws_road":"road","w_toad":"toad","ws_toad":"toad","w_soap":"soap","ws_soap":"soap","w_goal":"goal","ws_goal":"goal","w_loaf":"loaf","ws_loaf":"loaf","w_oak":"oak","ws_oak":"oak","w_float":"float","ws_float":"float","w_toast":"toast","ws_toast":"toast","w_coach":"coach","ws_coach":"coach","w_blow":"blow","ws_blow":"blow","w_slow":"slow","ws_slow":"slow","w_crow":"crow","ws_crow":"crow","w_flow":"flow","ws_flow":"flow","w_glow":"glow","ws_glow":"glow","w_bowl":"bowl","ws_bowl":"bowl","w_throw":"throw","ws_throw":"throw","w_mow":"mow","ws_mow":"mow","w_grown":"grown","ws_grown":"grown","w_sigh":"sigh","ws_sigh":"sigh","w_tight":"tight","ws_tight":"tight","w_bright":"bright","ws_bright":"bright","w_flight":"flight","ws_flight":"flight","w_might":"might","ws_might":"might","w_lie":"lie","ws_lie":"lie","w_true":"true","ws_true":"true","w_clue":"clue","ws_clue":"clue","w_due":"due","ws_due":"due","w_barn":"barn","ws_barn":"barn","w_yarn":"yarn","ws_yarn":"yarn","w_hard":"hard","ws_hard":"hard","w_yard":"yard","ws_yard":"yard","w_scarf":"scarf","ws_scarf":"scarf","w_smart":"smart","ws_smart":"smart","w_harp":"harp","ws_harp":"harp","w_dark":"dark","ws_dark":"dark","w_bark":"bark","ws_bark":"bark","w_arm":"arm","ws_arm":"arm","w_cart":"cart","ws_cart":"cart","w_spark":"spark","ws_spark":"spark","w_chart":"chart","ws_chart":"chart","w_porch":"porch","ws_porch":"porch","w_torch":"torch","ws_torch":"torch","w_sport":"sport","ws_sport":"sport","w_fort":"fort","ws_fort":"fort","w_sort":"sort","ws_sort":"sort","w_north":"north","ws_north":"north","w_born":"born","ws_born":"born","w_store":"store","ws_store":"store","w_snore":"snore","ws_snore":"snore","w_shore":"shore","ws_shore":"shore","w_herd":"herd","ws_herd":"herd","w_perch":"perch","ws_perch":"perch","w_verb":"verb","ws_verb":"verb","w_germ":"germ","ws_germ":"germ","w_third":"third","ws_third":"third","w_dirt":"dirt","ws_dirt":"dirt","w_skirt":"skirt","ws_skirt":"skirt","w_swirl":"swirl","ws_swirl":"swirl","w_twirl":"twirl","ws_twirl":"twirl","w_stir":"stir","ws_stir":"stir","w_chirp":"chirp","ws_chirp":"chirp","w_curl":"curl","ws_curl":"curl","w_fur":"fur","ws_fur":"fur","w_curb":"curb","ws_curb":"curb","w_church":"church","ws_church":"church","w_burp":"burp","ws_burp":"burp","w_surf":"surf","ws_surf":"surf","w_slurp":"slurp","ws_slurp":"slurp","w_blur":"blur","ws_blur":"blur","w_nest":"nest","ws_nest":"nest","w_muffin":"muffin","ws_muffin":"muffin","w_wagon":"wagon","ws_wagon":"wagon","w_tennis":"tennis","ws_tennis":"tennis","w_dentist":"dentist","ws_dentist":"dentist","w_cotton":"cotton","ws_cotton":"cotton","w_zigzag":"zigzag","ws_zigzag":"zigzag","w_dolphin":"dolphin","ws_dolphin":"dolphin","w_dinner":"dinner","ws_dinner":"dinner","w_hammer":"hammer","ws_hammer":"hammer","w_ladder":"ladder","ws_ladder":"ladder","w_zipper":"zipper","ws_zipper":"zipper","w_hamster":"hamster","ws_hamster":"hamster","w_baby":"baby","ws_baby":"baby","w_puppy":"puppy","ws_puppy":"puppy","w_kitty":"kitty","ws_kitty":"kitty","w_sunny":"sunny","ws_sunny":"sunny","w_teddy":"teddy","ws_teddy":"teddy","w_candy":"candy","ws_candy":"candy","w_pony":"pony","ws_pony":"pony","w_panda":"panda","ws_panda":"panda","w_sofa":"sofa","ws_sofa":"sofa","w_pillow":"pillow","ws_pillow":"pillow","w_elbow":"elbow","ws_elbow":"elbow","w_shadow":"shadow","ws_shadow":"shadow","w_party":"party","ws_party":"party","w_farmer":"farmer","ws_farmer":"farmer","w_corner":"corner","ws_corner":"corner","w_marker":"marker","ws_marker":"marker","w_hilltop":"hilltop","ws_hilltop":"hilltop","w_laptop":"laptop","ws_laptop":"laptop","w_bedtime":"bedtime","ws_bedtime":"bedtime","w_seaweed":"seaweed","ws_seaweed":"seaweed","w_beehive":"beehive","ws_beehive":"beehive","w_fishbowl":"fishbowl","ws_fishbowl":"fishbowl","w_spaceship":"spaceship","ws_spaceship":"spaceship","w_bacon":"bacon","ws_bacon":"bacon","w_tulip":"tulip","ws_tulip":"tulip","w_hippo":"hippo","ws_hippo":"hippo","w_rover":"rover","ws_rover":"rover","w_insect":"insect","ws_insect":"insect","w_ribbon":"ribbon","ws_ribbon":"ribbon","w_ticket":"ticket","ws_ticket":"ticket","w_planet":"planet","ws_planet":"planet","w_comet":"comet","ws_comet":"comet","w_trumpet":"trumpet","ws_trumpet":"trumpet","w_puppet":"puppet","ws_puppet":"puppet","w_animal":"animal","ws_animal":"animal","w_family":"family","ws_family":"family","w_fantastic":"fantastic","ws_fantastic":"fantastic","w_acrobat":"acrobat","ws_acrobat":"acrobat","w_satellite":"satellite","ws_satellite":"satellite","w_computer":"computer","ws_computer":"computer","w_coconut":"coconut","ws_coconut":"coconut","w_tomato":"tomato","ws_tomato":"tomato","w_potato":"potato","ws_potato":"potato","w_gorilla":"gorilla","ws_gorilla":"gorilla","w_vanilla":"vanilla","ws_vanilla":"vanilla","w_elevator":"elevator","ws_elevator":"elevator","sy_jam":"jam","sy_duck":"duck","sy_bell":"bell","sy_nest":"nest","sy_tree":"tree","sy_boat":"boat","sy_star":"star","sy_muff":"muff","sy_fin":"fin","sy_wag":"wag","sy_lem":"lem","sy_ten":"ten","sy_niss":"niss","sy_den":"den","sy_tist":"tist","sy_cot":"cot","sy_mitt":"mitt","sy_zig":"zig","sy_zag":"zag","sy_doll":"doll","sy_bot":"bot","sy_pay":"pay","sy_per":"per","sy_win":"win","sy_sis":"sis","sy_din":"din","sy_ner":"ner","sy_sum":"sum","sy_mer":"mer","sy_ham":"ham","sy_lad":"lad","sy_der":"der","sy_zip":"zip","sy_let":"let","sy_ster":"ster","sy_bay":"bay","sy_bee":"bee","sy_hap":"hap","sy_pea":"pea","sy_pup":"pup","sy_bun":"bun","sy_tee":"tee","sy_ted":"ted","sy_dee":"dee","sy_can":"can","sy_poe":"poe","sy_jell":"jell","sy_lee":"lee","sy_zee":"zee","sy_bruh":"bruh","sy_pan":"pan","sy_duh":"duh","sy_so":"so","sy_fuh":"fuh","sy_low":"low","sy_doe":"doe","sy_yell":"yell","sy_beau":"beau","sy_shad":"shad","sy_oh":"oh","sy_rain":"rain","sy_gar":"gar","sy_par":"par","sy_far":"far","sy_core":"core","sy_mar":"mar","sy_ker":"ker","sy_birth":"birth","sy_day":"day","sy_pop":"pop","sy_corn":"corn","sy_sand":"sand","sy_box":"box","sy_bath":"bath","sy_tub":"tub","sy_hill":"hill","sy_top":"top","sy_back":"back","sy_pack":"pack","sy_lap":"lap","sy_bed":"bed","sy_time":"time","sy_shine":"shine","sy_sail":"sail","sy_coat":"coat","sy_sea":"sea","sy_weed":"weed","sy_hive":"hive","sy_bowl":"bowl","sy_snow":"snow","sy_man":"man","sy_flake":"flake","sy_space":"space","sy_too":"too","sy_lip":"lip","sy_hip":"hip","sy_ver":"ver","sy_in":"in","sy_sect":"sect","sy_drag":"drag","sy_rib":"rib","sy_bin":"bin","sy_tick":"tick","sy_pock":"pock","sy_jack":"jack","sy_buck":"buck","sy_plan":"plan","sy_kahm":"kahm","sy_trum":"trum","sy_pit":"pit","sy_an":"an","sy_mull":"mull","sy_fam":"fam","sy_fan":"fan","sy_tass":"tass","sy_ack":"ack","sy_ruh":"ruh","sy_bat":"bat","sy_sat":"sat","sy_light":"light","sy_kum":"kum","sy_pew":"pew","sy_coe":"coe","sy_nut":"nut","sy_ay":"A","sy_may":"may","sy_toe":"toe","sy_puh":"puh","sy_tay":"tay","sy_guh":"guh","sy_rill":"rill","sy_vuh":"vuh","sy_nill":"nill","sy_vay":"vay"};

function load(k, d){ try { var v = localStorage.getItem("speech:" + k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } }
function save(k, v){ try { localStorage.setItem("speech:" + k, JSON.stringify(v)); } catch(e){} }

var bridge = window.AndroidTTS || null;
var nativeAudio = window.AndroidAudio || null;   // the app plays clips natively (old WebViews can't)
/* volume level 0 (off) .. 6; 5 and 6 boost past the frame's maximum (see GameActivity) */
var MAX_LEVEL = 6, level = 5;
try { level = nativeAudio && nativeAudio.level ? nativeAudio.level() : load("level", 5); } catch(e){ level = 5; }
var clipToken = 0;
var browserTTS = !bridge && ("speechSynthesis" in window) ? window.speechSynthesis : null;
var clips = null;            // keys with recorded audio
var voices = [], voice = null;
var savedVoice = load("voice", "");
var listeners = [];
var queue = [], playing = null, rate = 1;

function notify(){ for (var i = 0; i < listeners.length; i++){ try { listeners[i](); } catch(e){} } }

/* The app's text-to-speech starts only if there are no recorded clips (see GameActivity.startTts). */
function clipsChecked(){
  if (!clips && bridge && bridge.enable){ try { bridge.enable(); } catch(e){} }
  notify();
}

/* recorded clips */
try {
  var x = new XMLHttpRequest();
  x.open("GET", "audio/index.json", true);
  x.onload = function(){
    if (x.status === 200){
      try { var arr = JSON.parse(x.responseText); clips = {}; for (var i = 0; i < arr.length; i++) clips[arr[i]] = true; } catch(e){ clips = null; }
    }
    clipsChecked();
  };
  x.onerror = clipsChecked;
  x.send();
} catch(e){}

/* text-to-speech voices */
function score(v){
  if (!/^en/i.test(v.lang || "")) return -1;
  var s = 100, n = v.name || "";
  if (/en[-_]US/i.test(v.lang)) s += 10;
  if (/natural|neural|enhanced|premium|google/i.test(n)) s += 50;
  if (v.localService === false) s += 5;
  return s;
}
function loadVoices(){
  var list = [];
  try {
    if (bridge) list = JSON.parse(bridge.voices());
    else if (browserTTS) list = browserTTS.getVoices().map(function(v){ return {id:v.name, name:v.name, lang:v.lang, localService:v.localService, raw:v}; });
  } catch(e){ list = []; }
  voices = list.filter(function(v){ return score(v) >= 0; }).sort(function(a, b){ return score(b) - score(a); });
  voice = null;
  for (var i = 0; i < voices.length; i++) if (voices[i].id === savedVoice) voice = voices[i];
  if (!voice && voices.length) voice = voices[0];
  notify();
}
window.__ttsReady = loadVoices;
if (browserTTS){ browserTTS.onvoiceschanged = loadVoices; setTimeout(loadVoices, 300); }


function mode(){
  if (clips) return "audio";
  if (voices.length) return "tts";
  return "none";
}

/* called once when the current say() finishes (not when it is interrupted) */
var doneCb = null;
function finished(){ var cb = doneCb; doneCb = null; if (cb) setTimeout(cb, 0); }

function stop(){
  queue = [];
  doneCb = null;
  clipToken++;
  if (nativeAudio){ try { nativeAudio.stop(); } catch(e){} }
  if (playing){ try { playing.onended = null; playing.onerror = null; playing.pause(); } catch(e){} playing = null; }
  try { if (bridge) bridge.cancel(); else if (browserTTS) browserTTS.cancel(); } catch(e){}
}

window.__clipDone = function(token){ if (token === clipToken) playNext(); };

function playNext(){
  if (!queue.length){ playing = null; finished(); return; }
  var item = queue.shift(), key = item.k, r = item.r;
  if (nativeAudio){
    clipToken++;
    try {
      if (r !== 1 && nativeAudio.playRate) nativeAudio.playRate(key, clipToken, r);
      else nativeAudio.play(key, clipToken);
    } catch(e){ playNext(); }
    return;
  }
  var a = new Audio("audio/" + key + ".mp3");
  playing = a;
  try { a.volume = Math.min(1, level / 4); a.playbackRate = r; } catch(e){}
  a.onended = playNext;
  a.onerror = playNext;
  try { var p = a.play(); if (p && p["catch"]) p["catch"](function(){ playNext(); }); } catch(e){ playNext(); }
}

function sayTTS(texts){
  try {
    if (bridge){
      for (var i = 0; i < texts.length; i++) bridge.speak(texts[i], voice ? voice.id : "", 0.9 * rate, 1.0, i === 0);
    } else if (browserTTS){
      browserTTS.cancel();
      texts.forEach(function(t){
        var u = new SpeechSynthesisUtterance(t);
        if (voice && voice.raw){ u.voice = voice.raw; u.lang = voice.raw.lang; } else u.lang = "en-US";
        u.rate = 0.9; u.pitch = 1.0; browserTTS.speak(u);
      });
    }
  } catch(e){}
}

/* keys: list of phrase keys, e.g. ["w_cat","p_praise_0"] */
/* keys: phrase keys to say in order; done (optional): called when all of them have been said;
   speed (optional): 1 normal, above 1 faster and squeakier, below 1 slower and deeper (silly voices) */
function say(keys, done, speed){
  if (level <= 0 || !keys || !keys.length){ if (done) setTimeout(done, 0); return; }
  stop();
  doneCb = done || null;
  rate = speed || 1;
  var m = mode();
  if (m === "audio"){
    var allRecorded = keys.every(function(k){ return clips[k]; });
    if (allRecorded || !voices.length){
      queue = keys.filter(function(k){ return clips[k]; }).map(function(k){ return { k:k, r:rate }; });
      if (slowOn && rate === 1) queue = queue.map(slowItem);
      playNext();
      return;
    }
  }
  if (voices.length){
    sayTTS(keys.map(function(k){ return PHRASES[k] || ""; }).filter(Boolean));
    setTimeout(function(){ if (doneCb === done) finished(); }, 900 * keys.length);  // TTS gives no end signal
  } else finished();
}

/* ---- tap any word to hear it ----
   Speech.tapText(text) returns HTML where each word is <span class="tw" data-say="key">.
   Words map to w_<word>, numbers 0-100 to n_<n>, and + - x / = to the math words.
   One click handler for the whole page plays the clip (silent if there's no clip). */
var OPS = { "+":"m_plus", "-":"m_minus", "\u2212":"m_minus", "\u00d7":"m_times", "\u00f7":"m_div", "=":"m_equals" };
function tokenKey(tok){
  var t = String(tok).replace(/^[^A-Za-z0-9'+=\u2212\u00d7\u00f7-]+|[^A-Za-z0-9'+=\u2212\u00d7\u00f7-]+$/g, "");
  if (!t) return "";
  if (OPS[t]) return OPS[t];
  if (/^[0-9]+$/.test(t)){ var num = parseInt(t, 10); return num <= 100 ? "n_" + num : ""; }
  if (/^[A-Za-z']+$/.test(t)) return "w_" + t.toLowerCase().replace(/[^a-z0-9]/g, "");
  return "";
}
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function tapText(text){
  return String(text).split(/(\s+)/).map(function(part){
    if (!part || /^\s+$/.test(part)) return part;
    var k = tokenKey(part);
    return k ? '<span class="tw" data-say="' + k + '">' + esc(part) + '</span>' : esc(part);
  }).join("");
}
document.addEventListener("click", function(e){
  var t = e.target;
  while (t && t !== document && t.getAttribute){
    var k = t.getAttribute("data-say");
    if (k){
      say([k]);
      var shown = t;
      shown.className += " tw-on";
      setTimeout(function(){ shown.className = shown.className.replace(/\s*tw-on/g, ""); }, 600);
      return;
    }
    t = t.parentNode;
  }
}, false);
(function(){
  var st = document.createElement("style");
  st.textContent = ".tw{cursor:pointer;border-radius:.8vmin;-webkit-transition:background .15s;transition:background .15s}" +
    ".tw-on{background:rgba(255,217,61,.45)}";
  (document.head || document.documentElement).appendChild(st);
})();

/* ---- volume control: speaker, -, six bars, + ; fixed bottom-left on pickers and level lists ---- */
function setLevel(n){
  n = Math.max(0, Math.min(MAX_LEVEL, n));
  level = n;
  try { if (nativeAudio && nativeAudio.setLevel) nativeAudio.setLevel(n); } catch(e){}
  save("level", n);
  drawVolume();
  if (n > 0) say(["p_praise_0"]); else stop();
  notify();
}
var volBox = null;
function drawVolume(){
  if (!volBox) return;
  volBox.querySelector(".volicon").src = "emoji/" + (level === 0 ? "1f507" : level < 4 ? "1f508" : "1f50a") + ".svg";
  var bars = volBox.querySelectorAll(".volbar");
  for (var i = 0; i < bars.length; i++) bars[i].className = "volbar" + (i < level ? " on" : "") + (i >= 4 ? " boost" : "");
}
(function(){
  var st = document.createElement("style");
  st.textContent =
    /* top-right corner, level with the Back button; hidden during play */
    ".volbox{position:fixed;right:3vmin;top:4vmin;z-index:30;height:8vmin;padding:0 .8vmin;display:-webkit-flex;display:flex;" +
    "-webkit-align-items:center;align-items:center;background:#F7F9FF;border:0.5vmin solid #1F2A44;border-radius:4vmin;box-shadow:0.6vmin 0.6vmin 0 #05081A}" +
    "body[data-screen]:not([data-screen=home]) .volbox{display:none}" +
    ".volicon{width:4.8vmin;height:4.8vmin;margin:0 .8vmin 0 .6vmin}" +
    ".volb{width:6vmin;height:6vmin;border-radius:50%;border:0.4vmin solid #1F2A44;background:#FFD93D;color:#1F2A44;" +
    "font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600;font-size:4.4vmin;line-height:1;padding:0;cursor:pointer;outline:none;text-align:center;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center}" +
    ".volb:active{background:#FFC000}" +
    ".volbars{display:-webkit-flex;display:flex;-webkit-align-items:flex-end;align-items:flex-end;height:5.6vmin;margin:0 1vmin}" +
    ".volbar{width:2.6vmin;margin:0 .35vmin;border-radius:.6vmin;background:#D5DBEA;cursor:pointer}" +
    ".volbar.on{background:#3FB37F}.volbar.boost.on{background:#FF8A3D}" +
    /* the top row of pickers and level lists leaves room for it on the right */
    "body:not([data-screen]) .backroom,body[data-screen=home] .backroom{padding-right:40vmin}" +
    ".backroom > div{min-width:0;-webkit-flex:1;flex:1}";
  (document.head || document.documentElement).appendChild(st);
  volBox = document.createElement("div");
  volBox.className = "volbox";
  var bars = "";
  for (var i = 0; i < MAX_LEVEL; i++) bars += '<span class="volbar" data-level="' + (i + 1) + '" style="height:' + (1.6 + i*0.8) + 'vmin"></span>';
  volBox.innerHTML = '<img class="volicon" alt="">' +
    '<button class="volb" data-step="-1" aria-label="Quieter">&#8722;</button><span class="volbars">' + bars + '</span>' +
    '<button class="volb" data-step="1" aria-label="Louder">+</button>';
  volBox.onclick = function(e){
    var t = e.target, step = t.getAttribute("data-step"), lv = t.getAttribute("data-level");
    if (step) setLevel(level + parseInt(step, 10));
    else if (lv) setLevel(parseInt(lv, 10) === level ? level - 1 : parseInt(lv, 10));
  };
  document.body.appendChild(volBox);
  drawVolume();
})();

/* ---- turtle: an on/off toggle that says words slowly ----
   While it's on, every single word (w_ keys) is said slowly: its own slow recording (ws_<word>,
   recorded slower so it stays clear), or until that exists the normal clip at 0.7x. Instructions,
   sentences, praise and silly voices are never slowed. Remembered between games. */
var slowOn = load("slow", false);
function slowItem(it){
  if (!/^w_/.test(it.k)) return it;
  var ws = it.k.replace(/^w_/, "ws_");
  return clips && clips[ws] ? { k:ws, r:1 } : { k:it.k, r:0.7 };
}
var turtles = [];
function drawTurtles(){
  turtles = turtles.filter(function(b){ return document.body.contains(b); });
  turtles.forEach(function(b){ b.className = "turtle" + (slowOn ? " on" : ""); b.setAttribute("aria-pressed", slowOn ? "true" : "false"); });
}
function setSlow(on){ slowOn = !!on; save("slow", slowOn); drawTurtles(); }
function turtleButton(key){
  var b = document.createElement("button");
  b.setAttribute("aria-label", "Slow words");
  b.innerHTML = '<img src="emoji/1f422.svg" alt=""><span>Slow</span>';
  b.onclick = function(e){
    if (e && e.stopPropagation) e.stopPropagation();
    setSlow(!slowOn);
    if (key) say([key]);   // say the word at the new speed so she hears the difference
  };
  turtles.push(b);
  b.className = "turtle" + (slowOn ? " on" : "");
  return b;
}
(function(){
  var st = document.createElement("style");
  st.textContent = ".turtle{height:9vmin;margin:0 0 0 1.4vmin;padding:0 2.2vmin 0 1.4vmin;border-radius:4.5vmin;background:#F7F9FF;" +
    "border:0.5vmin solid #1F2A44;box-shadow:0.6vmin 0.6vmin 0 #05081A;cursor:pointer;outline:none;display:-webkit-inline-flex;display:inline-flex;" +
    "-webkit-align-items:center;align-items:center;font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600;font-size:3.4vmin;color:#4F5F80;vertical-align:middle}" +
    ".turtle img{width:6vmin;height:6vmin;margin-right:1vmin;display:block;opacity:.55}" +
    ".turtle.on{background:#7CFFB2;color:#14193A;border-color:#14193A}.turtle.on img{opacity:1}";
  (document.head || document.documentElement).appendChild(st);
})();

/* ---- turn timer: a few minutes each, then "Switch turns!" (so her brother gets turns too) ----
   The countdown runs in the app (AndroidApp.turnStart/turnLeft/turnStop, TurnTimer.kt), so it keeps
   going from page to page and over the photos (it opens the game to say "switch turns"). In a plain
   browser it's kept in localStorage. While it runs, every page shows a small countdown: in play
   under the stars (top right), on pickers and level lists just left of the volume control (the
   top row makes room); when it runs out, a popup on whatever page is open says "Switch turns!".
   The "Pick a mission" page has the start button (#turnbar) with - and + to pick the minutes
   (remembered as speech:turnMin). */
var TURN_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30];
function turnMin(){ var m = load("turnMin", 5); return TURN_CHOICES.indexOf(m) >= 0 ? m : 5; }
function stepTurnMin(dir){
  var i = TURN_CHOICES.indexOf(turnMin()) + dir;
  save("turnMin", TURN_CHOICES[Math.max(0, Math.min(TURN_CHOICES.length - 1, i))]);
  turnBarState = ""; turnTick();
}
var turnApp = window.AndroidApp && window.AndroidApp.turnLeft ? window.AndroidApp : null;
var turnPill = null, turnPop = null, turnBar = null, turnShown = false, turnBarState = "";
function turnLeft(){
  if (turnApp){ try { return Number(turnApp.turnLeft()) || 0; } catch(e){ return 0; } }
  var end = load("turnEnd", 0);
  if (!end) return 0;
  if (end < 0) return -1;
  if (end - Date.now() <= 0){ save("turnEnd", -1); return -1; }
  return end - Date.now();
}
function turnStart(){
  var m = turnMin(), ms = m * 60 * 1000;
  if (turnApp){ try { turnApp.turnStart(ms); } catch(e){} } else save("turnEnd", Date.now() + ms);
  turnTick();
  say(["p_your_turn", "n_" + m, m === 1 ? "p_minute" : "p_minutes", "p_have_fun"]);
}
function turnStop(){
  if (turnApp){ try { turnApp.turnStop(); } catch(e){} } else save("turnEnd", 0);
  turnTick();
}
function clock(ms){ var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
function drawTurnBar(left){
  if (!turnBar) return;
  var state = left > 0 ? "run" : "idle";
  if (state === turnBarState){ if (left > 0) turnBar.querySelector(".turnleft").innerHTML = clock(left) + " left"; return; }
  turnBarState = state;
  if (state === "idle"){
    var m = turnMin();
    turnBar.innerHTML = '<span class="turnpick"><button class="turnstep" data-dir="-1" aria-label="Fewer minutes">&#8722;</button>' +
      '<span class="turnmin">' + m + ' min</span><button class="turnstep" data-dir="1" aria-label="More minutes">+</button></span>' +
      '<button class="turngo"><img src="emoji/23f1.svg" alt="">Start a ' + m + '-minute turn</button>';
    turnBar.querySelector(".turngo").onclick = turnStart;
    var steps = turnBar.querySelectorAll(".turnstep");
    for (var i = 0; i < steps.length; i++) steps[i].onclick = function(){ stepTurnMin(parseInt(this.getAttribute("data-dir"), 10)); };
  } else {
    turnBar.innerHTML = '<span class="turnrun"><img src="emoji/23f3.svg" alt=""><span class="turnleft">' + clock(left) + ' left</span></span>' +
      '<button class="turnstop">Stop timer</button>';
    turnBar.querySelector(".turnstop").onclick = turnStop;
  }
}
function turnTick(){
  var left = turnLeft();
  if (turnPill){
    var on = left > 0 && !turnBar;
    turnPill.style.display = on ? "" : "none";
    if (/\bturnon\b/.test(document.body.className) !== on) document.body.className = on ? (document.body.className + " turnon").replace(/^ /, "") : document.body.className.replace(/\s*\bturnon\b/g, "");
    if (on){
      turnPill.querySelector("span").innerHTML = clock(left);
      var byVol = volBox && volBox.offsetWidth > 0, r = byVol ? volBox.getBoundingClientRect() : null;
      turnPill.className = "turnpill" + (left <= 60000 ? " soon" : "") + (byVol ? " byvol" : "");
      turnPill.style.right = byVol ? Math.round(window.innerWidth - r.left + r.height * 0.25) + "px" : "";
      turnPill.style.top = byVol ? Math.round(r.top + (r.height - turnPill.offsetHeight) / 2) + "px" : "";
    }
  }
  drawTurnBar(left);
  if (left === -1 && !turnShown){
    turnShown = true; turnPop.style.display = "";
    say(["p_switch_turns"]);
  } else if (left !== -1 && turnShown){
    turnShown = false; turnPop.style.display = "none";
  }
}
(function(){
  var st = document.createElement("style");
  st.textContent =
    ".turnpill{position:fixed;right:3vmin;top:11.1vmin;z-index:30;height:4.9vmin;padding:0 1.5vmin 0 .8vmin;border-radius:2.5vmin;background:#14193A;" +
    "border:0.45vmin solid #5CE1E6;color:#F3F6FF;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;pointer-events:none;" +
    "font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600;font-size:3vmin;box-shadow:0.5vmin 0.5vmin 0 #05081A}" +
    ".turnpill img{width:3.6vmin;height:3.6vmin;margin-right:.7vmin}" +
    ".turnpill.byvol{height:7vmin;font-size:4vmin;border-radius:3.5vmin}.turnpill.byvol img{width:5vmin;height:5vmin}" +
    /* beside the volume control, the top row leaves room for both */
    "body.turnon:not([data-screen]) .backroom,body.turnon[data-screen=home] .backroom{padding-right:67vmin}" +
    ".turnpill.soon{border-color:#FFD93D;color:#FFD93D}" +
    ".turnpop{position:fixed;left:0;top:0;right:0;bottom:0;z-index:100;background:rgba(5,8,26,.88);display:-webkit-flex;display:flex;" +
    "-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600}" +
    ".turncard{background:#1B2457;border:0.8vmin solid #FFD93D;border-radius:4vmin;box-shadow:1.2vmin 1.2vmin 0 #05081A;padding:5vmin 8vmin;text-align:center;color:#F3F6FF}" +
    ".turncard .turnicon{display:block;margin:0 auto;width:22vmin;height:22vmin;-webkit-animation:turnwob 1.2s ease-in-out infinite;animation:turnwob 1.2s ease-in-out infinite}" +
    "@-webkit-keyframes turnwob{0%,100%{-webkit-transform:rotate(-12deg)}50%{-webkit-transform:rotate(12deg)}}" +
    "@keyframes turnwob{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}" +
    ".turncard h2{margin:2vmin 0 1vmin;font-size:11vmin;line-height:1;color:#FFD93D;font-weight:600;text-shadow:0.6vmin 0.6vmin 0 #05081A}" +
    ".turncard p{margin:0 0 4vmin;font-size:4.4vmin;opacity:.9}" +
    ".turnbtns{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center}" +
    ".turnbtns button,.turnbar button{font-family:inherit;font-weight:600;cursor:pointer;outline:none;border:0.5vmin solid #1F2A44;border-radius:6vmin;" +
    "box-shadow:0.7vmin 0.7vmin 0 #05081A;color:#1F2A44;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center}" +
    ".turnbtns button{font-size:5vmin;padding:2vmin 4.4vmin;margin:0 1.6vmin;background:#F7F9FF}" +
    ".turnbtns .turnnext{background:#FFD93D}" +
    ".turnbtns img,.turnbar img{width:6vmin;height:6vmin;margin-right:1.4vmin}" +
    ".turnbtns button:active,.turnbar button:active{-webkit-transform:translate(0.5vmin,0.5vmin);transform:translate(0.5vmin,0.5vmin);box-shadow:0.2vmin 0.2vmin 0 #05081A}" +
    ".turnbar{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center;-webkit-align-items:center;align-items:center;font-family:\"WHFun\",\"Trebuchet MS\",sans-serif}" +
    ".turnbar button{font-size:4.4vmin;padding:1.4vmin 3.6vmin;background:#F7F9FF}" +
    ".turnbar .turngo{background:#FFD93D}" +
    ".turnpick{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;margin-right:3vmin;background:#F7F9FF;" +
    "border:0.5vmin solid #1F2A44;border-radius:6vmin;box-shadow:0.7vmin 0.7vmin 0 #05081A;padding:.8vmin;color:#1F2A44}" +
    ".turnbar .turnstep{width:7vmin;height:7vmin;padding:0;border-radius:50%;background:#FFD93D;font-size:5vmin;line-height:1;box-shadow:none;" +
    "border-width:0.4vmin;-webkit-justify-content:center;justify-content:center}" +
    ".turnmin{font-size:4.4vmin;min-width:15vmin;text-align:center}" +
    ".turnrun{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;font-size:5vmin;color:#FFD93D;margin-right:3vmin}" +
    ".turnrun img{width:7vmin;height:7vmin}";
  (document.head || document.documentElement).appendChild(st);
  turnPill = document.createElement("div");
  turnPill.className = "turnpill"; turnPill.style.display = "none";
  turnPill.innerHTML = '<img src="emoji/23f3.svg" alt=""><span></span>';
  document.body.appendChild(turnPill);
  turnPop = document.createElement("div");
  turnPop.className = "turnpop"; turnPop.style.display = "none";
  turnPop.innerHTML = '<div class="turncard"><img class="turnicon" src="emoji/23f3.svg" alt=""><h2>Switch turns!</h2><p>Time\'s up. Pass it to the next player.</p>' +
    '<div class="turnbtns"><button class="turnnext"><img src="emoji/1f504.svg" alt="">Next turn</button><button class="turndone">All done</button></div></div>';
  turnPop.querySelector(".turnnext").onclick = turnStart;
  turnPop.querySelector(".turndone").onclick = function(){ stop(); turnStop(); };
  document.body.appendChild(turnPop);
  function findBar(){ if (!turnBar){ turnBar = document.getElementById("turnbar"); turnBarState = ""; } turnTick(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", findBar, false); else findBar();
  setInterval(turnTick, 1000);
  // move the countdown as soon as the screen changes (pages set body[data-screen] in show())
  if (window.MutationObserver) new MutationObserver(turnTick).observe(document.body, { attributes:true, attributeFilter:["data-screen"] });
})();
/* the frame's Back key: while the popup is up it closes it (same as "All done") */
window.Turns = {
  start: turnStart,
  stop: turnStop,
  left: turnLeft,
  back: function(){ if (!turnShown) return false; stop(); turnStop(); return true; }
};

window.Speech = {
  turtleButton: turtleButton,
  slowOn: function(){ return slowOn; },
  setSlow: setSlow,
  tapText: tapText,
  tokenKey: tokenKey,
  say: say,
  stop: stop,
  mode: mode,
  canTalk: function(){ return level > 0 && mode() !== "none"; },
  soundOn: function(){ return level > 0; },
  level: function(){ return level; },
  setLevel: setLevel,
  voices: function(){ return voices; },
  voice: function(){ return voice; },
  setVoice: function(id){ for (var i = 0; i < voices.length; i++) if (voices[i].id === id) voice = voices[i]; savedVoice = id; save("voice", id); },
  onChange: function(fn){ listeners.push(fn); },
  key: function(word){ return "w_" + String(word).toLowerCase().replace(/[^a-z0-9]/g, ""); }
};
})();
